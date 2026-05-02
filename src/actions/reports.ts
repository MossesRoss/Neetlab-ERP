"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getStockReport(tenantId: string, category: string) {
    try {
        let query = supabase
            .from('items')
            .select('sku, name, uom, min_order_qty, stock_quantity, unit_price')
            .eq('tenant_id', tenantId);

        if (category !== 'ALL') {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('sku', { ascending: true });
        if (error) throw new Error(error.message);

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}