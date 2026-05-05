"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2, Landmark, Calendar, FileDigit, X } from 'lucide-react';
import { processIncomingPayment } from '@/actions/billing';
import { getAccounts } from '@/actions/gl';

export default function ReceivePaymentList({ invoices, accounts, tenantId }: { invoices: any[], accounts: any[], tenantId: string }) {
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const [coaAccounts, setCoaAccounts] = useState<any[]>(accounts || []);

    useEffect(() => {
        if (!coaAccounts || coaAccounts.length === 0) {
            getAccounts(tenantId).then(res => {
                if (res.success) setCoaAccounts(res.data);
            });
        }
    }, [accounts, tenantId]);

    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');

    const handleOpenPayment = (inv: any) => {
        setSelectedInvoice(inv);
        const balance = Number(inv.total_amount) - Number(inv.amount_paid || 0);
        setAmount(balance.toFixed(2));
        setAccountId('');
        setReference('');
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice || !accountId) return;

        setLoading(true);
        const res = await processIncomingPayment(tenantId, {
            invoiceId: selectedInvoice.id,
            amount,
            accountId,
            paymentDate,
            reference
        });

        if (!res.success) {
            alert(res.error);
            setLoading(false);
        } else {
            setSelectedInvoice(null);
            setLoading(false);
            window.location.reload();
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-sky-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Receive Payments</h2>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Total Billed</th>
                            <th className="px-6 py-4 text-right">Balance Due</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <CheckCircle size={32} className="mx-auto mb-3 opacity-50 text-emerald-500" />
                                    <p>All outstanding invoices have been collected.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv: any) => {
                                const total = Number(inv.total_amount);
                                const paid = Number(inv.amount_paid || 0);
                                const balance = total - paid;

                                // SARGENT FIX: Calculate true settlement status
                                const isSettled = inv.status === 'PAID' || balance <= 0;

                                return (
                                    <tr key={inv.id} className="hover:bg-sky-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-sky-700">INV-{inv.id.split('-')[0].toUpperCase()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{inv.entities?.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${isSettled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                inv.status === 'PARTIALLY_PAID' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                    'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {isSettled ? 'PAID' : inv.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500 text-xs">
                                            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                                            ₹{isSettled ? '0.00' : balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {/* SARGENT FIX: Lock out payment action if invoice is settled */}
                                            {isSettled ? (
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2">Settled</span>
                                            ) : (
                                                <button onClick={() => handleOpenPayment(inv)} className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm">
                                                    <CreditCard size={12} />
                                                    <span>Receive</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="bg-sky-950 text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold uppercase tracking-wider text-sm">Process Payment</h3>
                                <p className="text-[10px] text-sky-200 font-mono mt-0.5">INV-{selectedInvoice.id.split('-')[0].toUpperCase()} | {selectedInvoice.entities?.name}</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="text-sky-200 hover:text-white transition-colors p-1"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
                            <div>
                                <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Landmark size={14} className="mr-1.5" /> Deposit To Account
                                </label>
                                <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-sky-500 bg-white">
                                    <option value="">Please Select...</option>
                                    {coaAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.account_number} - {acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        <Calendar size={14} className="mr-1.5" /> Payment Date
                                    </label>
                                    <input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-sky-500" />
                                </div>
                                <div>
                                    <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Amount (₹)
                                    </label>
                                    <input required type="number" step="0.01" min="0.01" max={Number(selectedInvoice.total_amount) - Number(selectedInvoice.amount_paid || 0)} value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-sky-500" />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <FileDigit size={14} className="mr-1.5" /> Reference / UTR Number
                                </label>
                                <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-sky-500" />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                                <button type="button" onClick={() => setSelectedInvoice(null)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={loading || !accountId} className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span>Process Payment</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}