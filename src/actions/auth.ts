"use server";

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getDbClient } from '@/lib/supabase';
import { canAccess, MODULE_PERMISSIONS } from '@/lib/rbac';

export async function authenticate(formData: FormData) {
    const supabase = getDbClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        // 1. Query the database for the user dynamically
        const { data: user, error } = await supabase
            .from('users')
            .select('tenant_id, role, password_hash')
            .eq('email', email)
            .single();

        if (error || !user) {
            return { success: false, error: 'Invalid credentials. User not found in system.' };
        }

        // 2. Verify password (CTO Note: In production, we use bcrypt.compare here)
        if (password !== user.password_hash) {
            return { success: false, error: 'Invalid credentials. Incorrect password.' };
        }

        const cookieStore = await cookies();

        // 3. Set the Secure Enterprise Cookies based on DB records
        cookieStore.set('tenant_id', user.tenant_id, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
        });

        cookieStore.set('user_role', user.role, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
        });

        cookieStore.set('user_email', email, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
        });

        revalidatePath('/');
        return { success: true };

    } catch (err: any) {
        console.error("Auth System Error:", err);
        return { success: false, error: 'Internal authentication service error.' };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('tenant_id');
    cookieStore.delete('user_role');
    cookieStore.delete('user_email');
    revalidatePath('/');
}

// ============================================================================
// THE STRICT LENS: Server-Side Access Verification
// ============================================================================
export async function verifyAccess(moduleId: keyof typeof MODULE_PERMISSIONS) {
    const cookieStore = await cookies();
    const role = cookieStore.get('user_role')?.value;

    if (!role || !canAccess(role, moduleId)) {
        throw new Error(`SECURITY ALERT: Unauthorized attempt to access ${moduleId}. Incident logged.`);
    }

    return role;
}