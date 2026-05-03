"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUsers(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, role, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function provisionUser(tenantId: string, payload: any) {
    try {
        // Enforce basic enterprise password length
        if (payload.password.length < 8) throw new Error("Password must be at least 8 characters.");

        const { data, error } = await supabase
            .from('users')
            .insert({
                tenant_id: tenantId,
                email: payload.email,
                password_hash: payload.password, // In a future phase, integrate bcrypt here
                role: payload.role
            })
            .select()
            .single();

        if (error) {
            // Friendly error for unique constraint violation
            if (error.code === '23505') throw new Error("A user with this email already exists.");
            throw new Error(error.message);
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}