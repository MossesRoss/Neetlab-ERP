"use server";

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the Service Role key to bypass RLS during early dev.
// In Phase 2, we will replace this with createServerClient + User JWTs.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createPurchaseOrder(formData: any) {
    try {
        // 1. SECURITY MEASURE: Never trust client calculations. 
        // We recalculate the line totals and final document total on the server.
        let calculatedTotal = 0;

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

        // 2. Insert the main Transaction record first (The Header)
        const { data: txn, error: txnError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: formData.tenantId,
                entity_id: formData.vendorId,
                type: 'PURCHASE_ORDER',
                status: 'PENDING_APPROVAL',
                transaction_date: new Date().toISOString().split('T')[0],
                total_amount: calculatedTotal
            })
            .select()
            .single();

        if (txnError) throw new Error(`Transaction Error: ${txnError.message}`);

        // 3. Attach the Foreign Key and Insert the Transaction Lines
        const linesToInsert = secureLines.map((line: any) => ({
            ...line,
            transaction_id: txn.id
        }));

        const { error: linesError } = await supabase
            .from('transaction_lines')
            .insert(linesToInsert);

        if (linesError) {
            // In a production environment, we'd roll back the transaction here using a Postgres RPC.
            // We will add that advanced RPC logic in the next phase.
            throw new Error(`Line Items Error: ${linesError.message}`);
        }

        return { success: true, transactionId: txn.id, total: calculatedTotal };

    } catch (error: any) {
        console.error("Failed to create PO:", error);
        return { success: false, error: error.message };
    }
}