"use server";

import { prodDb, sandboxDb } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Overwrites a tenant's sandbox environment with a fresh snapshot of their production data.
 * This is a highly destructive operation for the sandbox database.
 */
export async function refreshTenantSandbox(tenantId: string) {
    console.log(`[SANDBOX REFRESH] Initiating snapshot for Tenant: ${tenantId}`);

    try {
        // =========================================================================
        // STEP 1: WIPE EXISTING SANDBOX DATA FOR THIS TENANT
        // Note: Order matters due to Foreign Key constraints. Delete children first.
        // =========================================================================
        const tablesToDelete = [
            'transaction_lines',
            'transactions',
            'inventory_movements',
            'items',
            'accounts',
            'financial_periods',
            'entities'
        ];

        for (const table of tablesToDelete) {
            const { error: deleteErr } = await sandboxDb
                .from(table)
                .delete()
                .eq('tenant_id', tenantId);

            if (deleteErr) throw new Error(`Failed to wipe Sandbox ${table}: ${deleteErr.message}`);
        }

        // =========================================================================
        // STEP 2: EXTRACT DATA FROM PRODUCTION
        // =========================================================================
        const tablesToCopy = [
            'entities',           // Base master data
            'financial_periods',
            'accounts',          // Chart of Accounts
            'items',             // Item Master
            'transactions',      // Headers (POs, SOs, Journals)
            'transaction_lines', // Lines
            'inventory_movements'
        ];

        const snapshotData: Record<string, any[]> = {};

        for (const table of tablesToCopy) {
            // Using a high limit. For massive enterprises, this needs pagination/batching.
            const { data, error } = await prodDb
                .from(table)
                .select('*')
                .eq('tenant_id', tenantId)
                .limit(10000);

            if (error) throw new Error(`Failed to extract Prod ${table}: ${error.message}`);
            snapshotData[table] = data || [];
        }

        // =========================================================================
        // STEP 3: SEED THE SANDBOX
        // Note: Order matters. Insert parent records before children.
        // =========================================================================
        for (const table of tablesToCopy) {
            const records = snapshotData[table];
            if (records.length === 0) continue;

            const { error: insertErr } = await sandboxDb
                .from(table)
                .insert(records);

            if (insertErr) throw new Error(`Failed to seed Sandbox ${table}: ${insertErr.message}`);
        }

        console.log(`[SANDBOX REFRESH] Successfully refreshed Tenant: ${tenantId}`);

        // Clear Next.js cache so the UI updates immediately
        revalidatePath('/');
        return { success: true, message: "Sandbox successfully synchronized with Production." };

    } catch (error: any) {
        console.error("[SANDBOX REFRESH ERROR]:", error);
        return { success: false, error: error.message };
    }
}