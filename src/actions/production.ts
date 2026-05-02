"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createJobCard(tenantId: string, payload: any) {
    try {
        const { data: job, error: jobError } = await supabase
            .from('job_cards')
            .insert({
                tenant_id: tenantId,
                product_id: payload.productId,
                quantity: payload.quantity,
                assigned_to: payload.assignedTo,
                status: 'ISSUED'
            })
            .select()
            .single();

        if (jobError) throw new Error(jobError.message);

        const materials = payload.materials.map((m: any) => ({
            job_card_id: job.id,
            material_id: m.materialId,
            quantity_required: m.quantity
        }));

        await supabase.from('job_card_materials').insert(materials);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
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

        // 1. Validate & Deduct Raw Materials (Consumption)
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

        // 2. Increment Finished Good (Production)
        movements.push({
            tenant_id: tenantId,
            item_id: job.product_id,
            quantity_change: Math.abs(job.quantity),
            movement_type: 'PRODUCTION'
        });

        // 3. Post to Subledger & Update Status
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