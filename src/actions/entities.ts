"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getEntities(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch Entities:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function createEntity(tenantId: string, payload: any) {
    try {
        const { error } = await supabase
            .from('entities')
            .insert({
                tenant_id: tenantId,
                type: payload.type,
                name: payload.name,
                email: payload.email || null,
                phone: payload.phone || null,
                website: payload.website || null,
                tax_id: payload.taxId || null,
                payment_terms: payload.paymentTerms || 'Net 30',
                billing_address: payload.billingAddress || null,
                shipping_address: payload.shippingAddress || null
            });

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateEntity(tenantId: string, entityId: string, payload: any) {
    try {
        const { error } = await supabase
            .from('entities')
            .update({
                type: payload.type,
                name: payload.name,
                email: payload.email || null,
                phone: payload.phone || null,
                website: payload.website || null,
                tax_id: payload.taxId || null,
                payment_terms: payload.paymentTerms || 'Net 30',
                billing_address: payload.billingAddress || null,
                shipping_address: payload.shippingAddress || null
            })
            .eq('id', entityId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}