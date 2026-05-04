"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createPurchaseOrder(payload: any) {
    try {
        let totalGrossPreTax = 0;
        let totalTax = 0;

        // Secure server-side recalculation of taxes and discounts
        const secureLines = payload.lines.map((line: any) => {
            const qty = Number(line.quantity) || 0;
            const price = Number(line.unitPrice) || 0;
            const disc = Number(line.discountRate) || 0;
            const tax = Number(line.taxRate) || 0;

            const gross = qty * price;
            const discAmt = gross * (disc / 100);
            const netPreTax = gross - discAmt;
            const taxAmt = netPreTax * (tax / 100);
            const lineTotal = netPreTax + taxAmt;

            totalGrossPreTax += netPreTax;
            totalTax += taxAmt;

            return {
                description: line.description,
                item_id: line.itemId || null,
                quantity: qty,
                unit_price: price,
                discount_rate: disc,
                tax_rate: tax,
                line_total: lineTotal
            };
        });

        const overallDisc = Number(payload.overallDiscount) || 0;
        const shippingAmt = Number(payload.shippingAmount) || 0; // SARGENT FIX: Landed Costs
        const subtotalWithTax = totalGrossPreTax + totalTax;
        const overallDiscAmt = subtotalWithTax * (overallDisc / 100);
        const finalTotalAmount = subtotalWithTax - overallDiscAmt + shippingAmt;

        const { data: txn, error: txnError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: payload.tenantId,
                entity_id: payload.vendorId,
                type: 'PURCHASE_ORDER',
                status: 'PENDING_APPROVAL',
                transaction_date: new Date().toISOString().split('T')[0],
                total_amount: finalTotalAmount,
                tax_amount: totalTax,
                overall_discount: overallDisc,
                shipping_amount: shippingAmt // SARGENT FIX: Landed Costs
            })
            .select()
            .single();

        if (txnError) throw new Error(`Transaction Error: ${txnError.message}`);

        const linesToInsert = secureLines.map((line: any) => ({ ...line, transaction_id: txn.id }));
        const { error: linesError } = await supabase.from('transaction_lines').insert(linesToInsert);

        if (linesError) throw new Error(`Line Items Error: ${linesError.message}`);

        revalidatePath('/');
        return { success: true, transactionId: txn.id };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updatePurchaseOrder(tenantId: string, poId: string, payload: any) {
    try {
        let totalGrossPreTax = 0;
        let totalTax = 0;

        const secureLines = payload.lines.map((line: any) => {
            const qty = Number(line.quantity) || 0;
            const price = Number(line.unitPrice) || 0;
            const disc = Number(line.discountRate) || 0;
            const tax = Number(line.taxRate) || 0;

            const gross = qty * price;
            const discAmt = gross * (disc / 100);
            const netPreTax = gross - discAmt;
            const taxAmt = netPreTax * (tax / 100);
            const lineTotal = netPreTax + taxAmt;

            totalGrossPreTax += netPreTax;
            totalTax += taxAmt;

            return {
                transaction_id: poId,
                description: line.description,
                item_id: line.itemId || null,
                quantity: qty,
                unit_price: price,
                discount_rate: disc,
                tax_rate: tax,
                line_total: lineTotal
            };
        });

        const overallDisc = Number(payload.overallDiscount) || 0;
        const shippingAmt = Number(payload.shippingAmount) || 0; // SARGENT FIX: Landed Costs
        const subtotalWithTax = totalGrossPreTax + totalTax;
        const overallDiscAmt = subtotalWithTax * (overallDisc / 100);
        const finalTotalAmount = subtotalWithTax - overallDiscAmt + shippingAmt;

        const { error: txnError } = await supabase.from('transactions').update({
            entity_id: payload.vendorId,
            total_amount: finalTotalAmount,
            tax_amount: totalTax,
            overall_discount: overallDisc,
            shipping_amount: shippingAmt // SARGENT FIX: Landed Costs
        }).eq('id', poId).eq('tenant_id', tenantId);

        if (txnError) throw new Error(txnError.message);

        await supabase.from('transaction_lines').delete().eq('transaction_id', poId);
        await supabase.from('transaction_lines').insert(secureLines);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getPurchaseOrders(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('id, transaction_number, transaction_date, status, total_amount, entities ( name )')
            .eq('tenant_id', tenantId)
            .eq('type', 'PURCHASE_ORDER')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: [] }; }
}

export async function getPurchaseOrderDetails(tenantId: string, poId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, transaction_lines(*), entities(*)')
            .eq('id', poId)
            .eq('tenant_id', tenantId)
            .single();
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message, data: null }; }
}

// SARGENT FIX: Added Approval Engine logic
export async function updatePurchaseOrderStatus(tenantId: string, poId: string, newStatus: string) {
    try {
        const { error } = await supabase
            .from('transactions')
            .update({ status: newStatus })
            .eq('id', poId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}