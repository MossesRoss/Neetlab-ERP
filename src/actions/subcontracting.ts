"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createDeliveryChallan(tenantId: string, payload: any) {
    try {
        const { data: dc, error: dcError } = await supabase
            .from('delivery_challans')
            .insert({ tenant_id: tenantId, vendor_id: payload.vendorId, status: 'PENDING' })
            .select().single();

        if (dcError) throw new Error(dcError.message);

        const lines = payload.lines.map((l: any) => ({ dc_id: dc.id, item_id: l.itemId, quantity: l.quantity }));
        await supabase.from('dc_lines').insert(lines);

        const movements = payload.lines.map((l: any) => ({
            tenant_id: tenantId, item_id: l.itemId, quantity_change: -Math.abs(l.quantity), movement_type: 'SUBCONTRACT_OUT'
        }));
        await supabase.from('inventory_movements').insert(movements);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function receiveDeliveryChallan(tenantId: string, dcId: string) {
    try {
        const { data: dc, error: dcError } = await supabase
            .from('delivery_challans')
            .select('*, dc_lines(*)')
            .eq('id', dcId).single();

        if (dcError || !dc) throw new Error("DC not found");
        if (dc.status === 'RETURNED') throw new Error("Already returned");

        const movements = dc.dc_lines.map((l: any) => ({
            tenant_id: tenantId, item_id: l.item_id, quantity_change: Math.abs(l.quantity), movement_type: 'SUBCONTRACT_IN'
        }));
        await supabase.from('inventory_movements').insert(movements);
        await supabase.from('delivery_challans').update({ status: 'RETURNED' }).eq('id', dcId);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDeliveryChallans(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('delivery_challans')
            .select('*, entities(name), dc_lines(*, items(sku, name, uom))')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
}