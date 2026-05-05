"use client";

import React from 'react';
import { Users, Plus, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EntityDirectory({ entities, tenantId }: { entities: any[], tenantId: string }) {
    const router = useRouter();

    const formatEntityId = (ent: any) => {
        if (ent.entity_number) {
            return `${ent.type === 'CUSTOMER' ? 'CUST' : 'VEND'}-${ent.entity_number}`;
        }
        // Fallback for old records before the serial column was added
        return ent.id.split('-')[0].toUpperCase();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-violet-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-violet-100 rounded-lg text-violet-700"><Users size={20} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Entity Directory</h2>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/?module=entity_directory&action=create')}
                        className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md"
                    >
                        <Plus size={16} /> <span>New Entity</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">System ID</th>
                                <th className="px-6 py-4">Entity Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Tax / GSTIN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {entities.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Building size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No entities registered in the directory.</p>
                                    </td>
                                </tr>
                            ) : (
                                entities.map((ent: any) => (
                                    <tr
                                        key={ent.id}
                                        onClick={() => router.push(`/?module=entity_directory&action=edit&id=${ent.id}`)}
                                        className="hover:bg-violet-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-violet-700">
                                            {formatEntityId(ent)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{ent.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${ent.type === 'CUSTOMER' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                                                {ent.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-700">{ent.email || '—'}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{ent.phone || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">
                                            {ent.tax_id || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}