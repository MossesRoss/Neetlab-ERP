"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createSalesOrder(formData: any) {
    try {
        let calculatedTotal = 0;

        // Server-side recalculation for immutable revenue integrity
        const secureLines = formData.lines.map((line: any) => {
            const quantity = Number(line.quantity) || 0;
            const unitPrice = Number(line.unitPrice) || 0;
            const lineTotal = quantity * unitPrice;
            calculatedTotal += lineTotal;

            return {
                description: line.description,
                quantity: quantity,
                unit_price: unitPrice,
                line_total: lineTotal
            };
        });

        const { data: txn, error: txnError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: formData.tenantId,
                entity_id: formData.customerId,
                type: 'SALES_ORDER',
                status: 'PENDING_FULFILLMENT',
                transaction_date: new Date().toISOString().split('T')[0],
                total_amount: calculatedTotal
            })
            .select()
            .single();

        if (txnError) throw new Error(`Transaction Error: ${txnError.message}`);

        const linesToInsert = secureLines.map((line: any) => ({
            ...line,
            transaction_id: txn.id
        }));

        const { error: linesError } = await supabase
            .from('transaction_lines')
            .insert(linesToInsert);

        if (linesError) throw new Error(`Line Items Error: ${linesError.message}`);

        revalidatePath('/');
        return { success: true, transactionId: txn.id, total: calculatedTotal };

    } catch (error: any) {
        console.error("Failed to create SO:", error);
        return { success: false, error: error.message };
    }
}

export async function getSalesOrders(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
        id,
        transaction_date,
        status,
        total_amount,
        entities ( name )
      `)
            .eq('tenant_id', tenantId)
            .eq('type', 'SALES_ORDER')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch SOs:", error);
        return { success: false, error: error.message, data: [] };
    }
}