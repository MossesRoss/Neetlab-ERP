"use client";

import React, { useEffect } from 'react';
import { Building2 } from 'lucide-react';

export default function PrintableInvoice({ invoice }: { invoice: any }) {
    useEffect(() => {
        // Automatically trigger the browser's PDF / Print engine when opened
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!invoice) return <div className="p-10 font-bold text-red-500">Document failed to load.</div>;

    const subtotal = Number(invoice.total_amount) - Number(invoice.tax_amount || 0);

    return (
        <div className="bg-white text-slate-900 min-h-screen p-8 md:p-16 max-w-4xl mx-auto font-sans">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div>
                    <div className="flex items-center space-x-2 text-sky-700 font-black tracking-tighter text-3xl mb-4">
                        <Building2 size={32} />
                        <span>CORE ERP</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        123 Enterprise Way<br />
                        Global Business District<br />
                        admin@core.com
                    </p>
                </div>
                <div className="text-right">
                    <h1 className="text-5xl font-light text-slate-800 mb-4 tracking-tight">INVOICE</h1>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Invoice #:</span> INV-{invoice.id.split('-')[0].toUpperCase()}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Date:</span> {invoice.transaction_date}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Status:</span>
                            <span className={invoice.status === 'PAID' ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>
                                {invoice.status}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-12">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Bill To</h3>
                <p className="text-lg font-bold text-slate-800">{invoice.entities?.name}</p>
                <p className="text-sm text-slate-500">{invoice.entities?.email || 'No email on file'}</p>
            </div>

            <table className="w-full text-left text-sm mb-12">
                <thead className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="py-3">Description</th>
                        <th className="py-3 text-center">Qty</th>
                        <th className="py-3 text-right">Unit Price</th>
                        <th className="py-3 text-right">Line Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {invoice.transaction_lines?.map((line: any) => (
                        <tr key={line.id}>
                            <td className="py-4 text-slate-700">{line.description}</td>
                            <td className="py-4 text-center text-slate-700">{line.quantity}</td>
                            <td className="py-4 text-right text-slate-700">${Number(line.unit_price).toFixed(2)}</td>
                            <td className="py-4 text-right text-slate-900 font-bold">${Number(line.line_total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-72 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-4">
                        <span>Tax Amount</span>
                        <span>${Number(invoice.tax_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-slate-900 pt-2">
                        <span>Total Due</span>
                        <span>${Number(invoice.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-24 pt-8 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400">Thank you for your business. Please remit payment within 30 days.</p>
            </div>
        </div>
    );
}