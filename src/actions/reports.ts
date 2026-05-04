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

export async function getGeneralLedgerReport(tenantId: string, filters: { startDate?: string, endDate?: string, accountId?: string }) {
    try {
        let query = supabase
            .from('journal_lines')
            .select(`
                id, debit, credit, account_id,
                accounts!inner(account_number, name, type),
                journal_entries!inner(
                    id, entry_date, memo, tenant_id, 
                    transactions(type, transaction_number)
                )
            `)
            .eq('journal_entries.tenant_id', tenantId);

        // Apply specific filters requested by the user to avoid fetching the entire database
        if (filters.startDate) {
            query = query.gte('journal_entries.entry_date', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('journal_entries.entry_date', filters.endDate);
        }
        if (filters.accountId) {
            query = query.eq('account_id', filters.accountId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}