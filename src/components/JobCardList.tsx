"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Wrench, CheckCircle, Loader2 } from 'lucide-react';
import { completeJobCard } from '@/actions/production';

export default function JobCardList({ jobs, tenantId }: { jobs: any[], tenantId: string }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleComplete = async (id: string) => {
        if (!confirm("Complete production? This will consume raw materials and add finished goods to stock.")) return;
        setLoadingId(id);
        const res = await completeJobCard(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Job Cards</h2>
                        <p className="text-xs text-slate-500 mt-1">Manufacturing routing and material consumption.</p>
                    </div>
                </div>
                <Link href="/?module=job_cards&action=create" className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md">
                    <Plus size={16} /> <span>New Job</span>
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Job ID</th>
                            <th className="px-6 py-4">Target Product</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4 text-right">Target Qty</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {jobs.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No active job cards.</td></tr>
                        ) : (
                            jobs.map((job: any) => (
                                <tr key={job.id} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-700">JOB-{job.id.split('-')[0].toUpperCase()}</td>
                                    <td className="px-6 py-4 font-medium">[{job.items?.sku}] {job.items?.name}</td>
                                    <td className="px-6 py-4">{job.assigned_to}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold">{job.quantity} {job.items?.uom}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {job.status === 'ISSUED' && (
                                            <button onClick={() => handleComplete(job.id)} disabled={loadingId === job.id} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto">
                                                {loadingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} className="mr-1" />} Convert
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}