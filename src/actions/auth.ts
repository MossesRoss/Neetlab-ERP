"use server";

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function authenticate(formData: FormData) {
    const email = formData.get('email');
    const password = formData.get('password');

    // CTO Note: In a production app, we would validate this against Supabase Auth.
    // For Phase 9, we are establishing the secure Multi-Tenant Cookie architecture.
    if (email === 'admin@core.com' && password === 'admin123') {
        const cookieStore = await cookies();

        // Set the Tenant ID in a secure, HTTP-only cookie
        // This cannot be accessed or manipulated by client-side JavaScript.
        cookieStore.set('tenant_id', '11111111-1111-1111-1111-111111111111', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        revalidatePath('/');
        return { success: true };
    }

    return { success: false, error: 'Invalid credentials. Use admin@core.com / admin123' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('tenant_id');
    revalidatePath('/');
}