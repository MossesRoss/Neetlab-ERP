"use server";

import { revalidatePath } from 'next/cache';
import { getDbClient } from '@/lib/supabase';

/**
 * Parses the SKU from our description format: "[SKU-123] Item Name"
 */
function extractSku(description: string): string | null {
    const match = description.match(/\[(.*?)\]/);
    return match ? match[1] : null;
}

export async function receivePurchaseOrder(tenantId: string, poId: string) {
    const supabase = getDbClient();

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
    const supabase = getDbClient();

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
        let totalCostOfGoodsSold = 0;

        // 1. Strict Validation: Check all stock levels before allowing ANY deductions
        for (const line of so.transaction_lines) {
            const sku = extractSku(line.description);
            if (!sku) continue;

            const { data: item } = await supabase
                .from('items')
                .select('id, name, stock_quantity, unit_price')
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

            totalCostOfGoodsSold += (Number(item.unit_price) || 0) * requestedQty;
        }

        // 2. Insert the immutable ledger records
        if (movementsToInsert.length > 0) {
            const { error: moveError } = await supabase.from('inventory_movements').insert(movementsToInsert);
            if (moveError) throw new Error(`Subledger Error: ${moveError.message}`);
        }

        // 3. Post Journal Entry for Cost of Goods Sold
        if (totalCostOfGoodsSold > 0) {
            const { data: cogsAccount } = await supabase.from('accounts').select('id').eq('name', 'Cost of Goods Sold').single();
            const { data: inventoryAccount } = await supabase.from('accounts').select('id').eq('name', 'Inventory Asset').single();

            if (!cogsAccount || !inventoryAccount) {
                throw new Error('COGS or Inventory accounts not found.');
            }

            const { data: je, error: jeError } = await supabase.from('journal_entries').insert({
                tenant_id: tenantId,
                date: new Date().toISOString(),
                description: `COGS for SO #${so.id.split('-')[0]}`
            }).select().single();

            if (jeError) throw new Error(`JE Error: ${jeError.message}`);

            await supabase.from('journal_lines').insert([
                { journal_id: je.id, account_id: cogsAccount.id, debit: totalCostOfGoodsSold, description: `COGS for SO` },
                { journal_id: je.id, account_id: inventoryAccount.id, credit: totalCostOfGoodsSold, description: `Inventory relief for SO` }
            ]);
        }

        // 4. Update Transaction status
        await supabase.from('transactions').update({ status: 'FULFILLED' }).eq('id', soId);

        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        console.error("Sales Fulfillment Error:", error);
        return { success: false, error: error.message };
    }
}