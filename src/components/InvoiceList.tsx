"use client";

import React, { useState } from 'react';
import { Receipt, FileText, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { receivePayment } from '@/actions/billing';

export default function InvoiceList({ invoices }: { invoices: any[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const tenantId = '11111111-1111-1111-1111-111111111111';

    const handleRecordPayment = async (invId: string) => {
        if (!confirm("Record full payment for this invoice and post to Ledger (Cash vs A/R)?")) return;

        setLoadingId(invId);
        const result = await receivePayment(tenantId, invId);
        if (!result.success) {
            alert("Payment Error: " + result.error);
        }
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-sky-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">A/R Invoices</h2>
                    <p className="text-xs text-slate-500 mt-1">Legally binding payment demands hitting the General Ledger.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Source SO</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Amount Due</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <Receipt size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>No Invoices have been generated yet.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-sky-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-sky-700">
                                        INV-{inv.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                                        {inv.reference_id?.split('-')[0].toUpperCase() || '—'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{inv.entities?.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${
                                            inv.status === 'PAID' 
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                        ${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {inv.status !== 'PAID' ? (
                                            <button
                                                onClick={() => handleRecordPayment(inv.id)}
                                                disabled={loadingId === inv.id}
                                                className="flex items-center space-x-1 mx-auto bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {loadingId === inv.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle size={12} />
                                                )}
                                                <span>Collect</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Received</span>
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