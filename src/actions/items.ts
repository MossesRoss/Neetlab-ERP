"use server";

import { getDbClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getItems(tenantId: string) {
    const supabase = getDbClient();
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
    const supabase = getDbClient();
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