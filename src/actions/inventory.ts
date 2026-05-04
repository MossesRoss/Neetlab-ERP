"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Parses the SKU securely from our description format: "[SKU-123] Item Name"
 */
function extractSku(description: string): string | null {
    const match = description.match(/\[(.*?)\]/);
    return match ? match[1] : null;
}

export async function receivePurchaseOrder(tenantId: string, poId: string) {
    try {
        const { data: po, error: poError } = await supabase
            .from('transactions')
            .select('*, transaction_lines(*)')
            .eq('id', poId)
            .eq('tenant_id', tenantId)
            .single();

        if (poError || !po) throw new Error("Purchase Order not found.");
        if (po.status === 'FULFILLED') throw new Error("This Purchase Order has already been fulfilled.");

        // 1. Generate formal GRN record
        const { data: grn, error: grnError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: tenantId,
                entity_id: po.entity_id,
                type: 'GRN',
                status: 'COMPLETED',
                reference_id: po.id,
                transaction_date: new Date().toISOString().split('T')[0],
                total_amount: 0
            })
            .select()
            .single();

        if (grnError) throw new Error(`GRN Creation Error: ${grnError.message}`);

        const movementsToInsert = [];
        const grnLinesToInsert = [];

        // 2. Map lines to actual items in the database
        for (const line of po.transaction_lines) {
            const sku = extractSku(line.description);
            if (!sku) continue;

            const { data: item } = await supabase
                .from('items')
                .select('id')
                .eq('sku', sku)
                .eq('tenant_id', tenantId)
                .single();

            if (item) {
                grnLinesToInsert.push({
                    transaction_id: grn.id,
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: 0,
                    line_total: 0
                });

                movementsToInsert.push({
                    tenant_id: tenantId,
                    item_id: item.id,
                    transaction_id: grn.id, // Linked to GRN, not PO
                    quantity_change: Number(line.quantity),
                    movement_type: 'RECEIPT'
                });
            }
        }

        if (grnLinesToInsert.length > 0) {
            await supabase.from('transaction_lines').insert(grnLinesToInsert);
        }

        // 3. Insert the immutable ledger records
        if (movementsToInsert.length > 0) {
            const { error: moveError } = await supabase.from('inventory_movements').insert(movementsToInsert);
            if (moveError) throw new Error(`Subledger Error: ${moveError.message}`);
        }

        // 4. Update Transaction status
        await supabase.from('transactions').update({ status: 'FULFILLED' }).eq('id', poId);

        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        console.error("Inventory Receipt Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getGRNs(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`id, transaction_date, reference_id, entities(name)`)
            .eq('tenant_id', tenantId)
            .eq('type', 'GRN')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

// SARGENT FIX: Fetch full GRN details for printing
export async function getGRNDetails(tenantId: string, grnId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, entities(*), transaction_lines(*)')
            .eq('id', grnId)
            .eq('tenant_id', tenantId)
            .single();

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
}

export async function fulfillSalesOrder(tenantId: string, soId: string) {
    try {
        const { data: so, error: soError } = await supabase
            .from('transactions')
            .select('*, transaction_lines(*)')
            .eq('id', soId)
            .eq('tenant_id', tenantId)
            .single();

        if (soError || !so) throw new Error("Sales Order not found.");
        if (so.status === 'FULFILLED' || so.status === 'INVOICED') throw new Error("This Sales Order has already been fulfilled or invoiced.");

        const movementsToInsert = [];

        // 1. Strict Validation: Check all stock levels before allowing ANY deductions
        for (const line of so.transaction_lines) {
            const sku = extractSku(line.description);
            if (!sku) continue;

            const { data: item } = await supabase
                .from('items')
                .select('id, name, stock_quantity')
                .eq('sku', sku)
                .eq('tenant_id', tenantId)
                .single();

            if (!item) throw new Error(`Item [${sku}] not found in catalog.`);

            const currentQty = Number(item.stock_quantity) || 0;
            const requestedQty = Number(line.quantity) || 0;

            if (currentQty < requestedQty) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${currentQty}, Requested: ${requestedQty}`);
            }

            movementsToInsert.push({
                tenant_id: tenantId,
                item_id: item.id,
                transaction_id: so.id,
                quantity_change: -Math.abs(requestedQty), // Negative = Stock Decrease
                movement_type: 'FULFILLMENT'
            });
        }

        // 2. Insert immutable ledger records
        if (movementsToInsert.length > 0) {
            const { error: moveError } = await supabase.from('inventory_movements').insert(movementsToInsert);
            if (moveError) throw new Error(`Subledger Error: ${moveError.message}`);
        }

        // 3. Update Transaction status
        await supabase.from('transactions').update({ status: 'FULFILLED' }).eq('id', soId);

        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        console.error("Sales Fulfillment Error:", error);
        return { success: false, error: error.message };
    }
}