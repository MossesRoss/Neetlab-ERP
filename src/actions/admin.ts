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
            .select('id, email, name, mobile, role, has_access, is_sales_rep, department, job_title, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function getUserDetails(tenantId: string, userId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('tenant_id', tenantId)
            .single();

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
}

export async function provisionUser(tenantId: string, payload: any) {
    try {
        if (payload.hasAccess && payload.password.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        const { error } = await supabase
            .from('users')
            .insert({
                tenant_id: tenantId,
                name: payload.name,
                email: payload.email,
                mobile: payload.mobile,
                department: payload.department,
                job_title: payload.jobTitle,
                password_hash: payload.password || null,
                role: payload.role,
                has_access: payload.hasAccess,
                is_sales_rep: payload.isSalesRep
            });

        if (error) {
            if (error.code === '23505') throw new Error("A user with this email already exists.");
            throw new Error(error.message);
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUser(tenantId: string, userId: string, payload: any) {
    try {
        const updates: any = {
            name: payload.name,
            email: payload.email,
            mobile: payload.mobile,
            department: payload.department,
            job_title: payload.jobTitle,
            role: payload.role,
            has_access: payload.hasAccess,
            is_sales_rep: payload.isSalesRep
        };

        if (payload.password && payload.password.trim() !== '') {
            if (payload.password.length < 8) throw new Error("Password must be at least 8 characters.");
            updates.password_hash = payload.password;
        }

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}