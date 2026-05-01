"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Parses the SKU from our description format: "[SKU-123] Item Name"
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

        const movementsToInsert = [];

        // 1. Map lines to actual items in the database
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
                movementsToInsert.push({
                    tenant_id: tenantId,
                    item_id: item.id,
                    transaction_id: po.id,
                    quantity_change: Number(line.quantity), // Positive = Stock Increase
                    movement_type: 'RECEIPT'
                });
            }
        }

        // 2. Insert the immutable ledger records (The SQL trigger will update the item stock automatically!)
        if (movementsToInsert.length > 0) {
            const { error: moveError } = await supabase.from('inventory_movements').insert(movementsToInsert);
            if (moveError) throw new Error(`Subledger Error: ${moveError.message}`);
        }

        // 3. Update Transaction status
        await supabase.from('transactions').update({ status: 'FULFILLED' }).eq('id', poId);

        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        console.error("Inventory Receipt Error:", error);
        return { success: false, error: error.message };
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

            if (!item) throw new Error(`Item ${sku} not found in catalog.`);

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

        // 2. Insert the immutable ledger records
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