"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAccounts(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('id, account_number, name, type, is_active')
            .eq('tenant_id', tenantId)
            .order('account_number', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch Accounts:", error);
        return { success: false, error: error.message, data: [] };
    }
}

// ============================================
// NEW: Journal Entries
// ============================================
import { revalidatePath } from 'next/cache';

async function ensurePeriodOpen(tenantId: string, dateStr: string) {
    const date = new Date(dateStr);
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    const { data } = await supabase
        .from('financial_periods')
        .select('is_locked')
        .eq('tenant_id', tenantId)
        .eq('period_year', year)
        .eq('period_month', month)
        .single();

    if (data?.is_locked) {
        throw new Error(`Financial Period ${month}/${year} is CLOSED and LOCKED. Audit compliance prevents new transactions in this period.`);
    }
}

export async function createJournalEntry(formData: any) {
    try {
        const entryDate = new Date().toISOString().split('T')[0];
        await ensurePeriodOpen(formData.tenantId, entryDate);

        let totalDebit = 0;
        let totalCredit = 0;

        // 1. Server-side validation of double-entry rules
        const validLines = formData.lines.filter((l: any) => l.accountId);

        validLines.forEach((line: any) => {
            totalDebit += Number(line.debit) || 0;
            totalCredit += Number(line.credit) || 0;
        });

        // Precision rounding to avoid floating point math errors
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`Imbalanced Entry: Debits ($${totalDebit}) must equal Credits ($${totalCredit}).`);
        }

        if (totalDebit <= 0) {
            throw new Error("Journal entry must have a value greater than 0.");
        }

        // 2. Insert the Journal Entry Header
        const { data: je, error: jeError } = await supabase
            .from('journal_entries')
            .insert({
                tenant_id: formData.tenantId,
                entry_date: entryDate,
                memo: formData.memo
            })
            .select()
            .single();

        if (jeError) throw new Error(`Header Error: ${jeError.message}`);

        // 3. Insert the Lines
        const linesToInsert = validLines.map((line: any) => ({
            journal_entry_id: je.id,
            account_id: line.accountId,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0
        }));

        const { error: linesError } = await supabase
            .from('journal_lines')
            .insert(linesToInsert);

        if (linesError) throw new Error(`Line Items Error: ${linesError.message}`);

        revalidatePath('/');
        return { success: true, journalEntryId: je.id };

    } catch (error: any) {
        console.error("Failed to create JE:", error);
        return { success: false, error: error.message };
    }
}

export async function getJournalEntries(tenantId: string) {
    try {
        // Fetch JEs and aggregate their line totals
        const { data, error } = await supabase
            .from('journal_entries')
            .select(`
        id,
        entry_date,
        memo,
        journal_lines ( debit, credit )
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        // Calculate the total volume of the entry for display
        const formattedData = data.map((je: any) => {
            const total = je.journal_lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
            return { ...je, total };
        });

        return { success: true, data: formattedData };
    } catch (error: any) {
        console.error("Failed to fetch JEs:", error);
        return { success: false, error: error.message, data: [] };
    }
}