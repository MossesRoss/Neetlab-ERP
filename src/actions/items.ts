"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createItem(payload: any) {
    try {
        const { data: item, error } = await supabase.from('items').insert({
            tenant_id: payload.tenantId,
            sku: payload.sku,
            name: payload.name,
            category: payload.category,
            uom: payload.uom,
            min_order_qty: payload.minOrderQty,
            unit_price: payload.unitPrice
        }).select('id').single();

        if (error) throw new Error(error.message);

        // SARGENT FIX: Mint opening stock via subledger
        if (payload.openingStock && payload.openingStock > 0) {
            await supabase.from('inventory_movements').insert({
                tenant_id: payload.tenantId,
                item_id: item.id,
                quantity_change: payload.openingStock,
                movement_type: 'OPENING_BALANCE'
            });

            // SARGENT FIX: Sync the cached stock_quantity on the main items table
            await supabase.from('items').update({ stock_quantity: payload.openingStock }).eq('id', item.id);
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateItem(tenantId: string, itemId: string, payload: any) {
    try {
        const { error } = await supabase.from('items').update({
            sku: payload.sku,
            name: payload.name,
            category: payload.category,
            uom: payload.uom,
            min_order_qty: payload.minOrderQty,
            unit_price: payload.unitPrice
        }).eq('id', itemId).eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getItems(tenantId: string) {
    try {
        const { data, error } = await supabase.from('items').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function bulkImportItems(tenantId: string, items: any[]) {
    try {
        const payload = items.map(i => ({
            tenant_id: tenantId,
            sku: i.sku,
            name: i.name,
            category: i.category,
            uom: i.uom,
            min_order_qty: i.minOrderQty,
            unit_price: i.unitPrice
        }));
        const { data: insertedItems, error } = await supabase.from('items').insert(payload).select('id');
        if (error) throw new Error(error.message);

        // SARGENT FIX: Auto-seed 500 stock for all bulk imported items so QA can begin
        if (insertedItems && insertedItems.length > 0) {
            const movements = insertedItems.map(item => ({
                tenant_id: tenantId,
                item_id: item.id,
                quantity_change: 500,
                movement_type: 'OPENING_BALANCE'
            }));

            const { error: moveError } = await supabase.from('inventory_movements').insert(movements);
            if (moveError) console.error("Failed to seed movements:", moveError);

            // SARGENT FIX: Sync the cached stock_quantity for bulk imports
            const itemIds = insertedItems.map(i => i.id);
            await supabase.from('items').update({ stock_quantity: 500 }).in('id', itemIds);
        }

        revalidatePath('/');
        return { success: true, count: items.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bulkDeleteItems(tenantId: string, itemIds: string[]) {
    try {
        const { error } = await supabase.from('items').delete().eq('tenant_id', tenantId).in('id', itemIds);
        if (error) throw new Error(error.message);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getItemStockHistory(tenantId: string, itemId: string) {
    try {
        const { data, error } = await supabase
            .from('inventory_movements')
            .select(`id, created_at, quantity_change, movement_type, transactions (id, type, reference_id)`)
            .eq('tenant_id', tenantId)
            .eq('item_id', itemId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}