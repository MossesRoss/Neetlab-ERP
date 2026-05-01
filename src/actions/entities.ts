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
            .order('name', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch Entities:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function createEntity(formData: { tenantId: string, type: string, name: string, email: string }) {
    try {
        const { data, error } = await supabase
            .from('entities')
            .insert({
                tenant_id: formData.tenantId,
                type: formData.type, // 'CUSTOMER' or 'VENDOR'
                name: formData.name,
                email: formData.email
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true, entity: data };
    } catch (error: any) {
        console.error("Failed to create Entity:", error);
        return { success: false, error: error.message };
    }
}