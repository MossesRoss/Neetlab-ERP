"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getItems(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('sku', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch Items:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function createItem(formData: { tenantId: string, sku: string, name: string, type: string, unitPrice: number }) {
    try {
        const { data, error } = await supabase
            .from('items')
            .insert({
                tenant_id: formData.tenantId,
                sku: formData.sku.toUpperCase(),
                name: formData.name,
                type: formData.type,
                unit_price: Number(formData.unitPrice) || 0
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true, item: data };
    } catch (error: any) {
        console.error("Failed to create Item:", error);
        return { success: false, error: error.message };
    }
}