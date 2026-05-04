"use client";

import React from 'react';
import { PackageCheck, FileText, Printer } from 'lucide-react';

export default function GRNList({ grns }: { grns: any[] }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-emerald-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                        <PackageCheck size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Goods Receipt Notes (GRN)</h2>
                        <p className="text-xs text-slate-500 mt-1">Formal documentation of physically received items.</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">GRN Number</th>
                            <th className="px-6 py-4">Receipt Date</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Source PO</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {grns.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>No GRNs generated yet.</p>
                                </td>
                            </tr>
                        ) : (
                            grns.map((grn: any) => (
                                <tr key={grn.id} className="hover:bg-emerald-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-700">
                                        GRN-{grn.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{new Date(grn.transaction_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{grn.entities?.name}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        PO-{grn.reference_id?.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                            RECEIVED
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={`/?module=grns&action=print&id=${grn.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                                        >
                                            <Printer size={12} />
                                            <span>Print Slip</span>
                                        </a>
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