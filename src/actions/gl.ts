"use server";

import { revalidatePath } from 'next/cache';
import { getDbClient } from '@/lib/supabase';

export async function getJournalEntries(tenantId: string) {
    const supabase = getDbClient();

    try {
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*, journal_lines(*, accounts(*))')
            .eq('tenant_id', tenantId)
            // SARGENT FIX: Schema uses entry_date, not date
            .order('entry_date', { ascending: false });

        if (error) throw new Error(error.message);

        // Map total for frontend
        const formattedData = data.map(je => ({
            ...je,
            total: je.journal_lines.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0)
        }));

        return { success: true, data: formattedData };
    } catch (error: any) {
        console.error("Failed to fetch journal entries:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function getAccounts(tenantId: string) {
    const supabase = getDbClient();

    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('account_number', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch accounts:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function createJournalEntry(formData: any) {
    const supabase = getDbClient();

    try {
        // Enforce strict date on the server
        const entryDate = new Date().toISOString().split('T')[0];

        const { data: je, error: jeError } = await supabase.from('journal_entries').insert({
            tenant_id: formData.tenantId,
            entry_date: entryDate, // SARGENT FIX: Schema uses entry_date
            memo: formData.description || formData.memo || "Manual Entry" // Fallback support
        }).select().single();

        if (jeError) throw new Error(`JE Error: ${jeError.message}`);

        const linesToInsert = formData.lines.map((line: any) => ({
            journal_entry_id: je.id, // SARGENT FIX: Schema uses journal_entry_id
            account_id: line.accountId,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0
        }));

        const { error: linesError } = await supabase.from('journal_lines').insert(linesToInsert);
        if (linesError) throw new Error(`Lines Error: ${linesError.message}`);

        revalidatePath('/');
        return { success: true, journalEntryId: je.id };

    } catch (error: any) {
        console.error("Failed to create journal entry:", error);
        return { success: false, error: error.message };
    }
}

export async function createAccount(formData: any) {
    const supabase = getDbClient();

    try {
        const { data, error } = await supabase
            .from('accounts')
            .insert({
                tenant_id: formData.tenantId,
                name: formData.name,
                account_number: formData.account_number,
                type: formData.type,
                is_active: true
            })
            .select()
            .single();

        if (error) throw new Error(`Account creation failed: ${error.message}`);

        revalidatePath('/');
        return { success: true, data };

    } catch (error: any) {
        console.error("Failed to create account:", error);
        return { success: false, error: error.message };
    }
}

// SARGENT FIX: Secure Account Updater
export async function updateAccount(tenantId: string, accountId: string, formData: any) {
    const supabase = getDbClient();
    try {
        // Enterprise Rule: We ONLY update Name and Status.
        // Type and Number are immutable once created to protect the ledger.
        const { error } = await supabase
            .from('accounts')
            .update({
                name: formData.name,
                is_active: formData.is_active
            })
            .eq('id', accountId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(`Account update failed: ${error.message}`);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update account:", error);
        return { success: false, error: error.message };
    }
}