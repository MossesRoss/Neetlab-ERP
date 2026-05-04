"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createJobCard(tenantId: string, payload: any) {
    try {
        // SARGENT FIX: Securely calculate line totals and overall amount server-side
        let calculatedTotal = 0;
        const secureMaterials = payload.materials.map((m: any) => {
            const qty = Number(m.quantity) || 0;
            const price = Number(m.unitPrice) || 0;
            const disc = Number(m.discountRate) || 0;
            const tax = Number(m.taxRate) || 0;

            const sub = qty * price;
            const afterDisc = sub * (1 - disc / 100);
            const lineTotal = afterDisc * (1 + tax / 100);
            calculatedTotal += lineTotal;

            return {
                material_id: m.materialId,
                quantity_required: qty,
                unit_price: price,
                discount_rate: disc,
                tax_rate: tax,
                line_total: lineTotal
            };
        });

        const overallDisc = Number(payload.overallDiscount) || 0;
        const finalTotalAmount = calculatedTotal * (1 - overallDisc / 100);

        const { data: job, error: jobError } = await supabase
            .from('job_cards')
            .insert({
                tenant_id: tenantId,
                customer_id: payload.customerId || null,
                product_id: payload.productId || null,
                quantity: payload.quantity || null,
                assigned_to: payload.assignedTo || null,
                overall_discount: overallDisc,
                total_amount: finalTotalAmount,
                status: 'QUOTE'
            })
            .select()
            .single();

        if (jobError) throw new Error(jobError.message);

        const materialsWithJobId = secureMaterials.map(m => ({ ...m, job_card_id: job.id }));
        await supabase.from('job_card_materials').insert(materialsWithJobId);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateJobCard(tenantId: string, jobId: string, payload: any) {
    try {
        // SARGENT FIX: Securely calculate line totals and overall amount server-side
        let calculatedTotal = 0;
        const secureMaterials = payload.materials.map((m: any) => {
            const qty = Number(m.quantity) || 0;
            const price = Number(m.unitPrice) || 0;
            const disc = Number(m.discountRate) || 0;
            const tax = Number(m.taxRate) || 0;

            const sub = qty * price;
            const afterDisc = sub * (1 - disc / 100);
            const lineTotal = afterDisc * (1 + tax / 100);
            calculatedTotal += lineTotal;

            return {
                job_card_id: jobId,
                material_id: m.materialId,
                quantity_required: qty,
                unit_price: price,
                discount_rate: disc,
                tax_rate: tax,
                line_total: lineTotal
            };
        });

        const overallDisc = Number(payload.overallDiscount) || 0;
        const finalTotalAmount = calculatedTotal * (1 - overallDisc / 100);

        const { error: jobError } = await supabase.from('job_cards').update({
            customer_id: payload.customerId || null,
            product_id: payload.productId || null,
            quantity: payload.quantity || null,
            assigned_to: payload.assignedTo || null,
            overall_discount: overallDisc,
            total_amount: finalTotalAmount
        }).eq('id', jobId).eq('tenant_id', tenantId);

        if (jobError) throw new Error(jobError.message);

        await supabase.from('job_card_materials').delete().eq('job_card_id', jobId);
        await supabase.from('job_card_materials').insert(secureMaterials);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateJobCardStatus(tenantId: string, jobId: string, newStatus: string) {
    try {
        const { error } = await supabase.from('job_cards').update({ status: newStatus }).eq('id', jobId).eq('tenant_id', tenantId);
        if (error) throw new Error(error.message);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function completeJobCard(tenantId: string, jobId: string) {
    try {
        const { data: job, error: jobError } = await supabase
            .from('job_cards')
            .select('*, items(name, sku), job_card_materials(*, items(name, sku, stock_quantity))')
            .eq('id', jobId)
            .single();

        if (jobError || !job) throw new Error("Job Card not found.");
        if (job.status === 'COMPLETED') throw new Error("Job already completed.");

        const movements = [];

        for (const mat of job.job_card_materials) {
            const currentStock = Number(mat.items.stock_quantity) || 0;
            if (currentStock < mat.quantity_required) {
                throw new Error(`Insufficient stock for ${mat.items.sku}. Need ${mat.quantity_required}, have ${currentStock}.`);
            }
            movements.push({
                tenant_id: tenantId,
                item_id: mat.material_id,
                quantity_change: -Math.abs(mat.quantity_required),
                movement_type: 'CONSUMPTION'
            });
        }

        if (job.product_id) {
            movements.push({
                tenant_id: tenantId,
                item_id: job.product_id,
                quantity_change: Math.abs(job.quantity || 1),
                movement_type: 'PRODUCTION'
            });
        }

        const { error: moveError } = await supabase.from('inventory_movements').insert(movements);
        if (moveError) throw new Error(moveError.message);

        await supabase.from('job_cards').update({ status: 'COMPLETED' }).eq('id', jobId);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getJobCards(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('job_cards')
            .select(`*, items(name, sku, uom)`)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function getJobCardDetails(tenantId: string, jobId: string) {
    try {
        const { data, error } = await supabase
            .from('job_cards')
            // SARGENT FIX: We must fetch the joined 'items' data for both the target product AND the BOM materials!
            .select(`*, items(sku, name, uom), job_card_materials(*, items(sku, name, uom, stock_quantity))`)
            .eq('id', jobId)
            .eq('tenant_id', tenantId)
            .single();

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
}