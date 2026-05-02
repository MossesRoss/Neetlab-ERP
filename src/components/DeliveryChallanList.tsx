"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { receiveDeliveryChallan } from '@/actions/subcontracting';

export default function DeliveryChallanList({ dcs, tenantId }: { dcs: any[], tenantId: string }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleReceive = async (id: string) => {
        if (!confirm("Receive items back from subcontractor? This restores inventory.")) return;
        setLoadingId(id);
        const res = await receiveDeliveryChallan(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-sky-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-700"><Truck size={20} /></div>
                    <div><h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Delivery Challans (DCs)</h2></div>
                </div>
                <Link href="/?module=delivery_challans&action=create" className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase shadow-md">
                    <Plus size={16} /> <span>New DC</span>
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">DC Number</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Subcontractor</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dcs.map((dc: any) => (
                            <tr key={dc.id} className="hover:bg-sky-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs font-bold text-sky-700">DC-{dc.id.split('-')[0].toUpperCase()}</td>
                                <td className="px-6 py-4 font-mono text-xs">{new Date(dc.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium">{dc.entities?.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${dc.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {dc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {dc.status === 'PENDING' && (
                                        <button onClick={() => handleReceive(dc.id)} disabled={loadingId === dc.id} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center mx-auto">
                                            {loadingId === dc.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} className="mr-1" />} Receive (DC-GRN)
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}