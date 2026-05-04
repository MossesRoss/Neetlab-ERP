"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Wrench, CheckCircle, Loader2, PlayCircle, ClipboardCheck, ArrowRight, User } from 'lucide-react';
import { completeJobCard, updateJobCardStatus } from '@/actions/production';
import Link from 'next/link';

export default function JobCardList({ jobs, entities, users, tenantId }: { jobs: any[], entities: any[], users: any[], tenantId: string }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleStatusUpdate = async (e: React.MouseEvent, id: string, newStatus: string) => {
        e.stopPropagation();
        setLoadingId(id);
        const res = await updateJobCardStatus(tenantId, id, newStatus);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    const handleComplete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Final Approval: Complete production? This will deduct raw materials and add finished goods to stock.")) return;
        setLoadingId(id);
        const res = await completeJobCard(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'QUOTE': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'ACCEPTED': return 'bg-sky-100 text-sky-700 border-sky-200';
            case 'ACTIVE': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'PENDING_APPROVAL': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getUserEmail = (id: string) => users.find(u => u.id === id)?.email || 'Unassigned';
    const getCustomerName = (id: string) => entities.find(e => e.id === id)?.name || 'Internal Job';

    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700"><Wrench size={20} /></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Job Card Pipeline</h2>
                    </div>
                </div>
                <Link href="/?module=job_cards&action=create" className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md">
                    <Plus size={16} /> <span>New Job Quote</span>
                </Link>
            </div>
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Job ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Target Product</th>
                            <th className="px-6 py-4">Technician</th>
                            <th className="px-6 py-4 text-center">Pipeline Stage</th>
                            <th className="px-6 py-4 text-center">Workflow Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {jobs.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No active job cards.</td></tr>
                        ) : (
                            jobs.map((job: any) => (
                                <tr key={job.id} onClick={() => router.push(`/?module=job_cards&action=edit&id=${job.id}`)} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                                    {/* SARGENT FIX: Elegant JOB-1 Serial IDs */}
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-700">JOB-{job.job_number || job.id.split('-')[0].toUpperCase()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{getCustomerName(job.customer_id)}</td>
                                    <td className="px-6 py-4 text-slate-600">{job.product_id ? `[${job.items?.sku}] ${job.items?.name}` : 'N/A (Service/Teardown)'}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500 flex items-center mt-1"><User size={12} className="mr-1" /> {getUserEmail(job.assigned_to)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(job.status)}`}>
                                            {job.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {job.status === 'QUOTE' && (
                                            <button onClick={(e) => handleStatusUpdate(e, job.id, 'ACCEPTED')} disabled={loadingId === job.id} className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <ClipboardCheck size={12} className="mr-1" />} Accept Quote
                                            </button>
                                        )}
                                        {job.status === 'ACCEPTED' && (
                                            <button onClick={(e) => handleStatusUpdate(e, job.id, 'ACTIVE')} disabled={loadingId === job.id} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} className="mr-1" />} Start Job
                                            </button>
                                        )}
                                        {job.status === 'ACTIVE' && (
                                            <button onClick={(e) => handleStatusUpdate(e, job.id, 'PENDING_APPROVAL')} disabled={loadingId === job.id} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} className="mr-1" />} Request Approval
                                            </button>
                                        )}
                                        {job.status === 'PENDING_APPROVAL' && (
                                            <button onClick={(e) => handleComplete(e, job.id)} disabled={loadingId === job.id} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} className="mr-1" />} Approve & Complete
                                            </button>
                                        )}
                                        {job.status === 'COMPLETED' && (
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2">Posted to Ledger</span>
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