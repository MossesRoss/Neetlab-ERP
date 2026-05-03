"use server";

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getDashboardData(tenantId: string) {
    try {
        // 1. Query the ultra-fast Postgres Views
        const { data: fin } = await supabase.from('vw_financial_metrics').select('*').eq('tenant_id', tenantId).single();
        const { data: mfg } = await supabase.from('vw_mfg_metrics').select('*').eq('tenant_id', tenantId).single();

        // NEW: Fetch the 6-month time-series trend array
        const { data: trends } = await supabase.from('vw_dashboard_trends_6mo').select('*').eq('tenant_id', tenantId).order('month_start', { ascending: true });

        // 2. Identify the user and fetch their custom layout
        const cookieStore = await cookies();
        const email = cookieStore.get('user_email')?.value;

        let layout = ['operating_cash', 'gross_margin', 'inventory_value', 'active_jobs', 'open_subcontracts', 'sales_backlog'];

        if (email) {
            const { data: user } = await supabase.from('users').select('dashboard_layout').eq('email', email).single();
            if (user && user.dashboard_layout) {
                layout = user.dashboard_layout;
            }
        }

        // 3. Calculate dynamic metrics (Gross Margin %)
        const revenue = Number(fin?.revenue || 0);
        const cogs = Number(fin?.cogs || 0);
        const grossMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;

        const metrics = {
            operating_cash: Number(fin?.operating_cash || 0),
            revenue: revenue,
            gross_margin: grossMargin,
            inventory_value: Number(mfg?.inventory_value || 0),
            active_jobs: Number(mfg?.active_jobs || 0),
            open_subcontracts: Number(mfg?.open_subcontracts || 0),
            sales_backlog: Number(mfg?.sales_backlog || 0),
            trends: trends || [] // Pass the trend array to the UI
        };

        return { success: true, metrics, layout };
    } catch (error: any) {
        console.error("Dashboard Engine Error:", error);
        return { success: false, error: error.message, metrics: {}, layout: [] };
    }
}

export async function saveDashboardLayout(layout: string[]) {
    try {
        const cookieStore = await cookies();
        const email = cookieStore.get('user_email')?.value;
        if (!email) throw new Error("Unauthorized");

        const { error } = await supabase
            .from('users')
            .update({ dashboard_layout: layout })
            .eq('email', email);

        if (error) throw new Error(error.message);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}