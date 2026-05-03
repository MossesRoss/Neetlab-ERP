"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getItems(tenantId: string, categoryFilter?: string, searchQuery?: string) {
    try {
        let query = supabase
            .from('items')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (categoryFilter && categoryFilter !== 'ALL') {
            query = query.eq('category', categoryFilter);
        }

        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function createItem(formData: any) {
    try {
        const { data, error } = await supabase
            .from('items')
            .insert({
                tenant_id: formData.tenantId,
                sku: formData.sku,
                name: formData.name,
                category: formData.category,
                type: formData.category, // FIX: Satisfies the old NOT NULL constraint
                uom: formData.uom,
                unit_price: formData.unitPrice,
                min_order_qty: formData.minOrderQty,
                stock_quantity: 0
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new Error("An item with this SKU already exists.");
            throw new Error(error.message);
        }

        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        console.error("Item Creation Error:", error);
        return { success: false, error: error.message };
    }
}

// ============================================
// NEW: CSV BULK IMPORT
// ============================================
export async function bulkImportItems(tenantId: string, items: any[]) {
    try {
        const payload = items.map(item => ({
            tenant_id: tenantId,
            sku: item.sku,
            name: item.name,
            category: item.category,
            type: item.category, // Satisfies DB constraint
            uom: item.uom,
            unit_price: Number(item.unitPrice) || 0,
            min_order_qty: Number(item.minOrderQty) || 0,
            stock_quantity: 0
        }));

        const { error } = await supabase.from('items').insert(payload);
        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true, count: items.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getItemStockHistory(tenantId: string, itemId: string) {
    try {
        const { data, error } = await supabase
            .from('inventory_movements')
            .select(`
                id,
                created_at,
                quantity_change,
                movement_type,
                transactions (
                    id,
                    type,
                    reference_id
                )
            `)
            .eq('tenant_id', tenantId)
            .eq('item_id', itemId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch stock subledger:", error);
        return { success: false, error: error.message, data: [] };
    }
}

// ============================================
// NEW: BULK DELETE
// ============================================
export async function bulkDeleteItems(tenantId: string, itemIds: string[]) {
    try {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('tenant_id', tenantId)
            .in('id', itemIds);

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}