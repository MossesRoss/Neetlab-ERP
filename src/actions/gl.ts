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
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
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
        const { data: je, error: jeError } = await supabase.from('journal_entries').insert({
            tenant_id: formData.tenantId,
            date: formData.date,
            description: formData.description
        }).select().single();

        if (jeError) throw new Error(`JE Error: ${jeError.message}`);

        const linesToInsert = formData.lines.map((line: any) => ({
            journal_id: je.id,
            account_id: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description
        }));

        await supabase.from('journal_lines').insert(linesToInsert);

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