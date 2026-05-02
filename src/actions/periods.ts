"use server";

import { getDbClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getPeriods(tenantId: string, year: number) {
    const supabase = getDbClient();
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
    const supabase = getDbClient();
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