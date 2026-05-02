"use server";

import { getDbClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * The Final Boss: Strict Audit Compliance Check
 * Enforces that no transactions can be generated or payments 
 * received within a closed and locked financial period.
 */
async function ensurePeriodOpen(tenantId: string, dateStr: string) {
    const supabase = getDbClient();
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

export async function generateInvoiceFromSO(tenantId: string, salesOrderId: string) {
    const supabase = getDbClient();
    try {
        const { data: so, error: soError } = await supabase.from('transactions').select('*, transaction_lines(*)').eq('id', salesOrderId).single();
        if (soError || !so) throw new Error("Sales Order not found.");
        if (so.status === 'INVOICED') throw new Error("Already invoiced.");
        if (so.status !== 'FULFILLED') throw new Error("Sales Order must be FULFILLED (inventory deducted) before it can be invoiced.");

        const transactionDate = new Date().toISOString().split('T')[0];

        // SECURE THE PERIOD
        await ensurePeriodOpen(tenantId, transactionDate);

        const { data: invoice, error: invError } = await supabase.from('transactions').insert({
            tenant_id: tenantId, entity_id: so.entity_id, type: 'INVOICE', status: 'UNPAID', reference_id: so.id,
            transaction_date: transactionDate, total_amount: so.total_amount
        }).select().single();

        if (invError) throw new Error(`Invoice Creation Error: ${invError.message}`);

        const linesToInsert = so.transaction_lines.map((line: any) => ({
            transaction_id: invoice.id, description: line.description, quantity: line.quantity, unit_price: line.unit_price, line_total: line.line_total
        }));
        await supabase.from('transaction_lines').insert(linesToInsert);
        await supabase.from('transactions').update({ status: 'INVOICED' }).eq('id', so.id);

        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('account_number', ['1200', '4000']);
        const arAccount = accounts?.find(a => a.account_number === '1200');
        const revAccount = accounts?.find(a => a.account_number === '4000');

        if (arAccount && revAccount) {
            const { data: je } = await supabase.from('journal_entries').insert({
                tenant_id: tenantId, transaction_id: invoice.id, entry_date: transactionDate,
                memo: `Auto-generated Revenue Recognition for Invoice ${invoice.id.split('-')[0].toUpperCase()}`
            }).select().single();

            if (je) {
                await supabase.from('journal_lines').insert([
                    { journal_entry_id: je.id, account_id: arAccount.id, debit: so.total_amount, credit: 0 },
                    { journal_entry_id: je.id, account_id: revAccount.id, debit: 0, credit: so.total_amount }
                ]);
            }
        }
        revalidatePath('/');
        return { success: true, invoiceId: invoice.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getInvoices(tenantId: string) {
    const supabase = getDbClient();
    try {
        const { data, error } = await supabase.from('transactions').select(`id, transaction_date, status, total_amount, tax_amount, reference_id, entities ( name )`).eq('tenant_id', tenantId).eq('type', 'INVOICE').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: [] }; }
}

export async function generateBillFromPO(tenantId: string, poId: string) {
    const supabase = getDbClient();
    try {
        const { data: po, error: poError } = await supabase.from('transactions').select('*, transaction_lines(*)').eq('id', poId).single();
        if (poError || !po) throw new Error("Purchase Order not found.");
        if (po.status !== 'FULFILLED') throw new Error("PO must be FULFILLED before billing.");

        const transactionDate = new Date().toISOString().split('T')[0];

        // SECURE THE PERIOD
        await ensurePeriodOpen(tenantId, transactionDate);

        const { data: bill, error: billError } = await supabase.from('transactions').insert({
            tenant_id: tenantId, entity_id: po.entity_id, type: 'BILL', status: 'UNPAID', reference_id: po.id,
            transaction_date: transactionDate, total_amount: po.total_amount
        }).select().single();
        if (billError) throw new Error(`Bill Creation Error: ${billError.message}`);

        const linesToInsert = po.transaction_lines.map((line: any) => ({
            transaction_id: bill.id, item_id: line.item_id, description: line.description, quantity: line.quantity, unit_price: line.unit_price, line_total: line.line_total
        }));
        await supabase.from('transaction_lines').insert(linesToInsert);
        await supabase.from('transactions').update({ status: 'BILLED' }).eq('id', po.id);

        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('account_number', ['2000', '5000']);
        const apAccount = accounts?.find(a => a.account_number === '2000');
        const cogsAccount = accounts?.find(a => a.account_number === '5000');

        if (!apAccount || !cogsAccount) throw new Error("Missing required COA accounts: 2000 (A/P) or 5000 (COGS). Check Chart of Accounts.");

        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId, transaction_id: bill.id, entry_date: transactionDate, memo: `Vendor Bill Recognition for PO ${po.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: cogsAccount.id, debit: po.total_amount, credit: 0 },
                { journal_entry_id: je.id, account_id: apAccount.id, debit: 0, credit: po.total_amount }
            ]);
        }
        revalidatePath('/');
        return { success: true, billId: bill.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getBills(tenantId: string) {
    const supabase = getDbClient();
    try {
        const { data, error } = await supabase.from('transactions').select(`id, transaction_date, status, total_amount, reference_id, entities ( name )`).eq('tenant_id', tenantId).eq('type', 'BILL').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: [] }; }
}

export async function receivePayment(tenantId: string, invoiceId: string) {
    const supabase = getDbClient();
    try {
        const { data: inv, error: invError } = await supabase.from('transactions').select('*').eq('id', invoiceId).single();
        if (invError || !inv) throw new Error("Invoice not found.");
        if (inv.status === 'PAID') throw new Error("Invoice is already paid.");

        const transactionDate = new Date().toISOString().split('T')[0];

        // SECURE THE PERIOD
        await ensurePeriodOpen(tenantId, transactionDate);

        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('account_number', ['1000', '1200']);
        const cashAcc = accounts?.find(a => a.account_number === '1000');
        const arAcc = accounts?.find(a => a.account_number === '1200');
        if (!cashAcc || !arAcc) throw new Error("Missing Treasury Accounts: 1000 (Cash) or 1200 (A/R).");

        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId, transaction_id: inv.id, entry_date: transactionDate, memo: `Cash Receipt for Invoice INV-${inv.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: cashAcc.id, debit: inv.total_amount, credit: 0 },
                { journal_entry_id: je.id, account_id: arAcc.id, debit: 0, credit: inv.total_amount }
            ]);
        }
        await supabase.from('transactions').update({ status: 'PAID' }).eq('id', inv.id);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function payBill(tenantId: string, billId: string) {
    const supabase = getDbClient();
    try {
        const { data: bill, error: billError } = await supabase.from('transactions').select('*').eq('id', billId).single();
        if (billError || !bill) throw new Error("Bill not found.");
        if (bill.status === 'PAID') throw new Error("Bill is already paid.");

        const transactionDate = new Date().toISOString().split('T')[0];

        // SECURE THE PERIOD
        await ensurePeriodOpen(tenantId, transactionDate);

        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('account_number', ['1000', '2000']);
        const cashAcc = accounts?.find(a => a.account_number === '1000');
        const apAcc = accounts?.find(a => a.account_number === '2000');
        if (!cashAcc || !apAcc) throw new Error("Missing Treasury Accounts: 1000 (Cash) or 2000 (A/P).");

        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId, transaction_id: bill.id, entry_date: transactionDate, memo: `Bill Payment for Vendor ${bill.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: apAcc.id, debit: bill.total_amount, credit: 0 },
                { journal_entry_id: je.id, account_id: cashAcc.id, debit: 0, credit: bill.total_amount }
            ]);
        }
        await supabase.from('transactions').update({ status: 'PAID' }).eq('id', bill.id);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// ============================================
// NEW: PHASE 23 DOCUMENT GENERATION DATA
// ============================================
export async function getInvoiceDetails(tenantId: string, invoiceId: string) {
    const supabase = getDbClient();
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`*, entities (*), transaction_lines (*)`)
            .eq('tenant_id', tenantId)
            .eq('id', invoiceId)
            .single();

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
}