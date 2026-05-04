"use client";

import React, { useEffect } from 'react';

export default function PrintableSO({ so, entities }: { so: any, entities: any[] }) {
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!so) return <div className="p-10 font-bold text-red-500">Document failed to load.</div>;

    const customer = entities.find(e => e.id === so.entity_id);

    const getLineGross = (mat: any) => (Number(mat.quantity) || 0) * (Number(mat.unit_price) || 0);
    const getLineDiscAmt = (mat: any) => getLineGross(mat) * ((Number(mat.discount_rate) || 0) / 100);
    const getLineNetPreTax = (mat: any) => getLineGross(mat) - getLineDiscAmt(mat);
    const getLineTaxAmt = (mat: any) => getLineNetPreTax(mat) * ((Number(mat.tax_rate) || 0) / 100);
    const getLineTotal = (mat: any) => getLineNetPreTax(mat) + getLineTaxAmt(mat);

    const totalGrossPreTax = (so.transaction_lines || []).reduce((sum: number, m: any) => sum + getLineNetPreTax(m), 0);
    const totalTax = (so.transaction_lines || []).reduce((sum: number, m: any) => sum + getLineTaxAmt(m), 0);
    const subtotalWithTax = totalGrossPreTax + totalTax;
    const overallDiscountAmt = subtotalWithTax * ((Number(so.overall_discount) || 0) / 100);
    const shippingAmt = Number(so.shipping_amount) || 0;
    const finalTotalAmount = subtotalWithTax - overallDiscountAmt + shippingAmt;

    return (
        <div className="bg-white text-slate-900 min-h-screen p-8 md:p-12 max-w-5xl mx-auto font-sans">
            <div className="grid grid-cols-2 gap-8 items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div>
                    <div className="mb-6">
                        <img src="/tanktech.png" alt="TankTechAsia" className="h-14 object-contain" />
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        123 Enterprise Way<br />
                        Global Business District<br />
                        sales@tanktechasia.com
                    </p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <h1 className="text-4xl font-light text-slate-800 mb-4 tracking-tight uppercase">
                        Order Confirmation
                    </h1>
                    <div className="space-y-1 text-right">
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Order #:</span> SO-{so.transaction_number || so.id.split('-')[0].toUpperCase()}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Date:</span> {new Date(so.transaction_date).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">PO Ref:</span> {so.external_reference || 'N/A'}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Status:</span>
                            <span className="font-black text-slate-800 uppercase">{so.status.replace('_', ' ')}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-2">Bill To</h3>
                    {customer ? (
                        <>
                            <p className="text-lg font-bold text-slate-800">{customer.name}</p>
                            <p className="text-sm text-slate-500">{customer.email || 'No email on file'}</p>
                            {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
                            {customer.billing_address && <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{customer.billing_address}</p>}
                        </>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No Customer Linked</p>
                    )}
                </div>
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-2">Ship To</h3>
                    {customer ? (
                        <>
                            <p className="text-lg font-bold text-slate-800">{customer.name}</p>
                            <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{customer.shipping_address || customer.billing_address || 'Address pending'}</p>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No Customer Linked</p>
                    )}
                </div>
            </div>

            <table className="w-full text-left text-sm mb-12">
                <thead className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="py-3">Item Description</th>
                        <th className="py-3 text-center">Qty</th>
                        <th className="py-3 text-right">Rate</th>
                        <th className="py-3 text-right">Disc</th>
                        <th className="py-3 text-right">Tax</th>
                        <th className="py-3 text-right">Line Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {so.transaction_lines?.map((line: any) => (
                        <tr key={line.id}>
                            <td className="py-4 text-slate-800 font-medium">{line.description}</td>
                            <td className="py-4 text-center text-slate-700">{line.quantity}</td>
                            <td className="py-4 text-right text-slate-700">₹{Number(line.unit_price || 0).toFixed(2)}</td>
                            <td className="py-4 text-right text-slate-700">{Number(line.discount_rate || 0)}%</td>
                            <td className="py-4 text-right text-slate-700">{Number(line.tax_rate || 0)}%</td>
                            <td className="py-4 text-right text-slate-900 font-bold">₹{getLineTotal(line).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-16">
                <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Total Gross (Pre-Tax)</span>
                        <span>₹{totalGrossPreTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Total Tax</span>
                        <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                    {Number(so.overall_discount) > 0 && (
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Overall Discount ({Number(so.overall_discount || 0)}%)</span>
                            <span>-₹{overallDiscountAmt.toFixed(2)}</span>
                        </div>
                    )}

                    {shippingAmt > 0 && (
                        <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-4">
                            <span>Shipping & Handling</span>
                            <span>₹{shippingAmt.toFixed(2)}</span>
                        </div>
                    )}
                    {!shippingAmt && <div className="border-b border-slate-200 pb-4"></div>}

                    <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>Final Total</span>
                        <span>₹{finalTotalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-24 pt-8 border-t border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Thank you for your business</p>
            </div>
        </div>
    );
}