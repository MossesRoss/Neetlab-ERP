"use server";

import { getDbClient } from '@/lib/supabase';

export async function getFinancialSummary(tenantId: string) {
    const supabase = getDbClient();
    try {
        // Fetch all posted journal lines with their associated account types
        const { data: lines, error } = await supabase
            .from('journal_lines')
            .select(`
        debit,
        credit,
        journal_entries!inner(tenant_id),
        accounts!inner(type, name)
      `)
            .eq('journal_entries.tenant_id', tenantId);

        if (error) throw new Error(error.message);

        let metrics = {
            operatingCash: 0,
            revenue: 0,
            expenses: 0,
            netIncome: 0
        };

        // Aggregate balances based on standard double-entry accounting rules
        lines?.forEach((line: any) => {
            const type = line.accounts.type;
            const debit = Number(line.debit) || 0;
            const credit = Number(line.credit) || 0;

            if (type === 'ASSET' && line.accounts.name.includes('Cash')) {
                metrics.operatingCash += (debit - credit); // Assets increase on Debit
            } else if (type === 'REVENUE') {
                metrics.revenue += (credit - debit); // Revenue increases on Credit
            } else if (type === 'EXPENSE') {
                metrics.expenses += (debit - credit); // Expenses increase on Debit
            }
        });

        metrics.netIncome = metrics.revenue - metrics.expenses;

        return { success: true, data: metrics };
    } catch (error: any) {
        console.error("Failed to fetch Financial Summary:", error);
        return { success: false, error: error.message, data: null };
    }
}