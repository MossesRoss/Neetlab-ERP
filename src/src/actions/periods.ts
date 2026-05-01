"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getPeriods(tenantId: string, year: number) {
    try {
        const { data, error } = await supabase
            .from('financial_periods')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('period_year', year)
            .order('period_month', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}

export async function togglePeriodLock(tenantId: string, month: number, year: number, lockState: boolean) {
    try {
        const { error } = await supabase
            .from('financial_periods')
            .upsert({
                tenant_id: tenantId,
                period_month: month,
                period_year: year,
                is_locked: lockState,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id, period_month, period_year' });

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}