"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * The Final Boss: Strict Audit Compliance Check
 * Enforces that no transactions can be generated or payments 
 * received within a closed and locked financial period.
 */
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

export async function generateInvoiceFromSO(tenantId: string, salesOrderId: string) {
    try {
        // SARGENT FIX: Deep fetch to get item costs for COGS calculation
        const { data: so, error: soError } = await supabase.from('transactions').select('*, transaction_lines(*, items(unit_price))').eq('id', salesOrderId).single();
        if (soError || !so) throw new Error("Sales Order not found.");
        if (so.status === 'INVOICED') throw new Error("Already invoiced.");
        if (so.status !== 'FULFILLED') throw new Error("Sales Order must be FULFILLED (inventory deducted) before it can be invoiced.");

        const transactionDate = new Date().toISOString().split('T')[0];

        // SECURE THE PERIOD
        await ensurePeriodOpen(tenantId, transactionDate);

        const { data: invoice, error: invError } = await supabase.from('transactions').insert({
            tenant_id: tenantId, entity_id: so.entity_id, type: 'INVOICE', status: 'UNPAID', reference_id: so.id,
            transaction_date: transactionDate, total_amount: so.total_amount, tax_amount: so.tax_amount
        }).select().single();

        if (invError) throw new Error(`Invoice Creation Error: ${invError.message}`);

        const linesToInsert = so.transaction_lines.map((line: any) => ({
            transaction_id: invoice.id, description: line.description, quantity: line.quantity, unit_price: line.unit_price, line_total: line.line_total
        }));
        await supabase.from('transaction_lines').insert(linesToInsert);
        await supabase.from('transactions').update({ status: 'INVOICED' }).eq('id', so.id);

        // SARGENT FIX: Enterprise GL Routing - AR, Revenue, Tax Payable, COGS, and Inventory
        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('account_number', ['1200', '4000', '2500', '5000', '1500']);
        const arAccount = accounts?.find(a => a.account_number === '1200');
        const revAccount = accounts?.find(a => a.account_number === '4000');
        const taxAccount = accounts?.find(a => a.account_number === '2500');
        const cogsAccount = accounts?.find(a => a.account_number === '5000');
        const invAccount = accounts?.find(a => a.account_number === '1500');

        if (arAccount && revAccount && taxAccount && cogsAccount && invAccount) {
            const { data: je } = await supabase.from('journal_entries').insert({
                tenant_id: tenantId, transaction_id: invoice.id, entry_date: transactionDate,
                memo: `Revenue, Tax & COGS Recognition for Invoice INV-${invoice.id.split('-')[0].toUpperCase()}`
            }).select().single();

            const totalAmount = Number(so.total_amount || 0);
            const taxAmount = Number(so.tax_amount || 0);
            const revenueAmount = totalAmount - taxAmount;

            // Calculate COGS based on original standard unit cost of items
            const totalCogs = so.transaction_lines.reduce((sum: number, line: any) => {
                return sum + (Number(line.quantity) * Number(line.items?.unit_price || 0));
            }, 0);

            if (je) {
                const journalLines = [
                    // 1. Recognize Revenue & Tax Liability
                    { journal_entry_id: je.id, account_id: arAccount.id, debit: totalAmount, credit: 0 },
                    { journal_entry_id: je.id, account_id: revAccount.id, debit: 0, credit: revenueAmount },

                    // 2. Recognize Cost of Goods Sold & Decrease Asset
                    { journal_entry_id: je.id, account_id: cogsAccount.id, debit: totalCogs, credit: 0 },
                    { journal_entry_id: je.id, account_id: invAccount.id, debit: 0, credit: totalCogs }
                ];

                if (taxAmount > 0) {
                    journalLines.push({ journal_entry_id: je.id, account_id: taxAccount.id, debit: 0, credit: taxAmount });
                }

                await supabase.from('journal_lines').insert(journalLines);
            }
        }
        revalidatePath('/');
        return { success: true, invoiceId: invoice.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getInvoices(tenantId: string) {
    try {
        const { data, error } = await supabase.from('transactions').select(`id, transaction_date, status, total_amount, tax_amount, reference_id, entities ( name )`).eq('tenant_id', tenantId).eq('type', 'INVOICE').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: [] }; }
}

// SARGENT FIX: Fetch only open invoices for the Treasury module
export async function getUnpaidInvoices(tenantId: string) {
    try {
        const { data, error } = await supabase.from('transactions')
            .select(`id, transaction_date, status, total_amount, amount_paid, reference_id, entities ( name )`)
            .eq('tenant_id', tenantId)
            .eq('type', 'INVOICE')
            .in('status', ['UNPAID', 'PARTIALLY_PAID'])
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: [] }; }
}

// SARGENT FIX: Advanced Payment Processor (Handles Partial Payments & Specific Bank Accounts)
export async function processIncomingPayment(tenantId: string, payload: any) {
    try {
        const { invoiceId, amount, accountId, paymentDate, reference } = payload;

        // SECURE THE PERIOD
        await ensurePeriodOpen(tenantId, paymentDate);

        const { data: inv, error: invError } = await supabase.from('transactions').select('*').eq('id', invoiceId).single();
        if (invError || !inv) throw new Error("Invoice not found.");
        if (inv.status === 'PAID') throw new Error("Invoice is already fully paid.");

        const paymentAmount = Number(amount);
        const newAmountPaid = Number(inv.amount_paid || 0) + paymentAmount;
        const newStatus = newAmountPaid >= Number(inv.total_amount) ? 'PAID' : 'PARTIALLY_PAID';

        // Get the specific Bank Account and the A/R Account
        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('id', [accountId]);
        const { data: arAccounts } = await supabase.from('accounts').select('id').eq('tenant_id', tenantId).eq('account_number', '1200');

        const bankAcc = accounts?.[0];
        const arAcc = arAccounts?.[0];

        if (!bankAcc || !arAcc) throw new Error("Missing Bank Account or A/R Account (1200).");

        // Generate the Journal Entry for this specific payment
        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId, transaction_id: inv.id, entry_date: paymentDate,
            memo: `Payment Received - Ref: ${reference || 'N/A'} for INV-${inv.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: bankAcc.id, debit: paymentAmount, credit: 0 },
                { journal_entry_id: je.id, account_id: arAcc.id, debit: 0, credit: paymentAmount }
            ]);
        }

        // Update the invoice
        await supabase.from('transactions').update({
            status: newStatus,
            amount_paid: newAmountPaid,
            payment_reference: reference || null
        }).eq('id', inv.id);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function generateBillFromPO(tenantId: string, poId: string) {
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

        // SARGENT FIX: Enterprise GL Routing - Capitalize to Inventory Asset (1500), not COGS (5000)
        const { data: accounts } = await supabase.from('accounts').select('id, account_number').eq('tenant_id', tenantId).in('account_number', ['2000', '1500']);
        const apAccount = accounts?.find(a => a.account_number === '2000');
        const invAccount = accounts?.find(a => a.account_number === '1500');

        if (!apAccount || !invAccount) throw new Error("Missing required COA accounts: 2000 (A/P) or 1500 (Inventory Asset). Check Chart of Accounts.");

        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId, transaction_id: bill.id, entry_date: transactionDate, memo: `Capitalize Inventory Asset from PO ${po.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: invAccount.id, debit: po.total_amount, credit: 0 },
                { journal_entry_id: je.id, account_id: apAccount.id, debit: 0, credit: po.total_amount }
            ]);
        }
        revalidatePath('/');
        return { success: true, billId: bill.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getBills(tenantId: string) {
    try {
        const { data, error } = await supabase.from('transactions').select(`id, transaction_date, status, total_amount, reference_id, entities ( name )`).eq('tenant_id', tenantId).eq('type', 'BILL').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: [] }; }
}

export async function receivePayment(tenantId: string, invoiceId: string) {
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

export async function getInvoiceDetails(tenantId: string, invoiceId: string) {
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