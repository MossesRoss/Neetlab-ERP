"use server";

import { getDbClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getUsers(tenantId: string) {
    const supabase = getDbClient();
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, role, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        console.error("Failed to fetch Users:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function createUser(tenantId: string, payload: any) {
    const supabase = getDbClient();
    try {
        const { data, error } = await supabase
            .from('users')
            .insert({
                tenant_id: tenantId,
                email: payload.email,
                password: payload.password, // In Phase 21+, we would handle Auth properly. 
                role: payload.role
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true, user: data };
    } catch (error: any) {
        console.error("Failed to create User:", error);
        return { success: false, error: error.message };
    }
}
