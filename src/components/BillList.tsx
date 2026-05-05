"use client";

import React, { useState } from 'react';
import { FileText, Clock, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { payBill } from '@/actions/billing';

export default function BillList({ bills }: { bills: any[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const tenantId = '11111111-1111-1111-1111-111111111111';

    const handleRecordPayment = async (billId: string) => {
        if (!confirm("Confirm payment of this bill and post to Ledger (Cash vs A/P)?")) return;

        setLoadingId(billId);
        const result = await payBill(tenantId, billId);
        if (!result.success) {
            alert("Payment Error: " + result.error);
        }
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-rose-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Accounts Payable Ledger</h2>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Bill ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {bills.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>No vendor bills found.</p>
                                </td>
                            </tr>
                        ) : (
                            bills.map((bill: any) => (
                                <tr key={bill.id} className="hover:bg-rose-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-rose-700 font-medium">
                                        {bill.id.split('-')[0].toUpperCase()}...
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{bill.transaction_date}</td>
                                    <td className="px-6 py-4 font-medium">{bill.entities?.name || 'Unknown Vendor'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`flex items-center justify-center space-x-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${bill.status === 'PAID'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                            {bill.status === 'PAID' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                            <span>{bill.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                        ${Number(bill.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {bill.status !== 'PAID' ? (
                                            <button
                                                onClick={() => handleRecordPayment(bill.id)}
                                                disabled={loadingId === bill.id}
                                                className="flex items-center space-x-1 mx-auto bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {loadingId === bill.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <CreditCard size={12} />
                                                )}
                                                <span>Pay Bill</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Disbursed</span>
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