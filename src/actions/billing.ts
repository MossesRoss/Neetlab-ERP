"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateInvoiceFromSO(tenantId: string, salesOrderId: string) {
    try {
        // 1. Fetch the original Sales Order and its lines
        const { data: so, error: soError } = await supabase
            .from('transactions')
            .select('*, transaction_lines(*)')
            .eq('id', salesOrderId)
            .single();

        if (soError || !so) throw new Error("Sales Order not found.");
        if (so.status === 'INVOICED') throw new Error("Already invoiced.");
        if (so.status !== 'FULFILLED') throw new Error("Sales Order must be FULFILLED (inventory deducted) before it can be invoiced.");

        // 2. Create the new Invoice Transaction linked to the SO
        const { data: invoice, error: invError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: tenantId,
                entity_id: so.entity_id,
                type: 'INVOICE',
                status: 'UNPAID',
                reference_id: so.id,
                transaction_date: new Date().toISOString().split('T')[0],
                total_amount: so.total_amount
            })
            .select()
            .single();

        if (invError) throw new Error(`Invoice Creation Error: ${invError.message}`);

        // 3. Copy the Line Items from the Sales Order
        const linesToInsert = so.transaction_lines.map((line: any) => ({
            transaction_id: invoice.id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total
        }));

        await supabase.from('transaction_lines').insert(linesToInsert);

        // 4. Update the original Sales Order status
        await supabase.from('transactions').update({ status: 'INVOICED' }).eq('id', so.id);

        // 5. THE MAGIC: Auto-post to the General Ledger!
        // Fetch Accounts Receivable (1200) and Sales Revenue (4000) accounts
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id, account_number')
            .eq('tenant_id', tenantId)
            .in('account_number', ['1200', '4000']);

        const arAccount = accounts?.find(a => a.account_number === '1200');
        const revAccount = accounts?.find(a => a.account_number === '4000');

        if (arAccount && revAccount) {
            const { data: je } = await supabase.from('journal_entries').insert({
                tenant_id: tenantId,
                transaction_id: invoice.id,
                entry_date: new Date().toISOString().split('T')[0],
                memo: `Auto-generated Revenue Recognition for Invoice ${invoice.id.split('-')[0].toUpperCase()}`
            }).select().single();

            if (je) {
                await supabase.from('journal_lines').insert([
                    { journal_entry_id: je.id, account_id: arAccount.id, debit: so.total_amount, credit: 0 }, // Debit A/R (Asset Increases)
                    { journal_entry_id: je.id, account_id: revAccount.id, debit: 0, credit: so.total_amount } // Credit Revenue (Revenue Increases)
                ]);
            }
        }

        revalidatePath('/');
        return { success: true, invoiceId: invoice.id };

    } catch (error: any) {
        console.error("Billing Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getInvoices(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`id, transaction_date, status, total_amount, reference_id, entities ( name )`)
            .eq('tenant_id', tenantId)
            .eq('type', 'INVOICE')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function generateBillFromPO(tenantId: string, poId: string) {
    try {
        // 1. Fetch the fulfilled PO and its lines
        const { data: po, error: poError } = await supabase
            .from('transactions')
            .select('*, transaction_lines(*)')
            .eq('id', poId)
            .single();

        if (poError || !po) throw new Error("Purchase Order not found.");
        if (po.status !== 'FULFILLED') throw new Error("PO must be FULFILLED before billing.");

        // 2. Create the Vendor Bill
        const { data: bill, error: billError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: tenantId,
                entity_id: po.entity_id,
                type: 'BILL',
                status: 'UNPAID',
                reference_id: po.id,
                transaction_date: new Date().toISOString().split('T')[0],
                total_amount: po.total_amount
            })
            .select()
            .single();

        if (billError) throw new Error(`Bill Creation Error: ${billError.message}`);

        // 3. Copy Lines
        const linesToInsert = po.transaction_lines.map((line: any) => ({
            transaction_id: bill.id,
            item_id: line.item_id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total
        }));

        await supabase.from('transaction_lines').insert(linesToInsert);

        // 4. Update PO Status
        await supabase.from('transactions').update({ status: 'BILLED' }).eq('id', po.id);

        // 5. LEDGER POSTING: Credit Accounts Payable (2000), Debit COGS (5000)
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id, account_number')
            .eq('tenant_id', tenantId)
            .in('account_number', ['2000', '5000']);

        const apAccount = accounts?.find(a => a.account_number === '2000');
        const cogsAccount = accounts?.find(a => a.account_number === '5000');

        if (!apAccount || !cogsAccount) {
            throw new Error("Missing required COA accounts: 2000 (A/P) or 5000 (COGS). Check Chart of Accounts.");
        }

        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId,
            transaction_id: bill.id,
            entry_date: new Date().toISOString().split('T')[0],
            memo: `Vendor Bill Recognition for PO ${po.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: cogsAccount.id, debit: po.total_amount, credit: 0 }, // Debit COGS (Expense Increase)
                { journal_entry_id: je.id, account_id: apAccount.id, debit: 0, credit: po.total_amount }  // Credit A/P (Liability Increase)
            ]);
        }

        revalidatePath('/');
        return { success: true, billId: bill.id };

    } catch (error: any) {
        console.error("AP Billing Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getBills(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`id, transaction_date, status, total_amount, reference_id, entities ( name )`)
            .eq('tenant_id', tenantId)
            .eq('type', 'BILL')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Receives Payment for an Invoice.
 * Posts JE: Debit 1000 Operating Cash, Credit 1200 A/R.
 */
export async function receivePayment(tenantId: string, invoiceId: string) {
    try {
        const { data: inv, error: invError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (invError || !inv) throw new Error("Invoice not found.");
        if (inv.status === 'PAID') throw new Error("Invoice is already paid.");

        // 1. Fetch accounts
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id, account_number')
            .eq('tenant_id', tenantId)
            .in('account_number', ['1000', '1200']);

        const cashAcc = accounts?.find(a => a.account_number === '1000');
        const arAcc = accounts?.find(a => a.account_number === '1200');

        if (!cashAcc || !arAcc) throw new Error("Missing Treasury Accounts: 1000 (Cash) or 1200 (A/R).");

        // 2. Post Journal Entry
        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId,
            transaction_id: inv.id,
            entry_date: new Date().toISOString().split('T')[0],
            memo: `Cash Receipt for Invoice INV-${inv.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: cashAcc.id, debit: inv.total_amount, credit: 0 }, // Debit Cash (Asset Increases)
                { journal_entry_id: je.id, account_id: arAcc.id, debit: 0, credit: inv.total_amount }   // Credit A/R (Asset Decreases)
            ]);
        }

        // 3. Update Status
        await supabase.from('transactions').update({ status: 'PAID' }).eq('id', inv.id);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Payment Receipt Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Pays a Vendor Bill.
 * Posts JE: Credit 1000 Operating Cash, Debit 2000 A/P.
 */
export async function payBill(tenantId: string, billId: string) {
    try {
        const { data: bill, error: billError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', billId)
            .single();

        if (billError || !bill) throw new Error("Bill not found.");
        if (bill.status === 'PAID') throw new Error("Bill is already paid.");

        // 1. Fetch accounts
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id, account_number')
            .eq('tenant_id', tenantId)
            .in('account_number', ['1000', '2000']);

        const cashAcc = accounts?.find(a => a.account_number === '1000');
        const apAcc = accounts?.find(a => a.account_number === '2000');

        if (!cashAcc || !apAcc) throw new Error("Missing Treasury Accounts: 1000 (Cash) or 2000 (A/P).");

        // 2. Post Journal Entry
        const { data: je } = await supabase.from('journal_entries').insert({
            tenant_id: tenantId,
            transaction_id: bill.id,
            entry_date: new Date().toISOString().split('T')[0],
            memo: `Bill Payment for Vendor ${bill.id.split('-')[0].toUpperCase()}`
        }).select().single();

        if (je) {
            await supabase.from('journal_lines').insert([
                { journal_entry_id: je.id, account_id: apAcc.id, debit: bill.total_amount, credit: 0 }, // Debit A/P (Liability Decreases)
                { journal_entry_id: je.id, account_id: cashAcc.id, debit: 0, credit: bill.total_amount } // Credit Cash (Asset Decreases)
            ]);
        }

        // 3. Update Status
        await supabase.from('transactions').update({ status: 'PAID' }).eq('id', bill.id);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Bill Payment Error:", error);
        return { success: false, error: error.message };
    }
}