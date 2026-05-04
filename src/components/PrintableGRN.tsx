"use client";

import React, { useEffect } from 'react';

export default function PrintableGRN({ grn }: { grn: any }) {
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!grn) return <div className="p-10 font-bold text-red-500">Document failed to load.</div>;

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
                        warehouse@tanktechasia.com
                    </p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <h1 className="text-4xl font-light text-slate-800 mb-4 tracking-tight uppercase">
                        Goods Receipt Note
                    </h1>
                    <div className="space-y-1 text-right">
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">GRN #:</span> GRN-{grn.id.split('-')[0].toUpperCase()}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Date Received:</span> {new Date(grn.transaction_date).toLocaleDateString()}</p>
                        <p className="text-sm text-slate-500"><span className="font-bold text-slate-800 w-24 inline-block">Source PO #:</span> PO-{grn.reference_id?.split('-')[0].toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-2">Received From</h3>
                {grn.entities ? (
                    <>
                        <p className="text-lg font-bold text-slate-800">{grn.entities.name}</p>
                        {grn.entities.phone && <p className="text-sm text-slate-500">{grn.entities.phone}</p>}
                        {grn.entities.billing_address && <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{grn.entities.billing_address}</p>}
                    </>
                ) : (
                    <p className="text-sm text-slate-500 italic">Unknown Vendor</p>
                )}
            </div>

            <table className="w-full text-left text-sm mb-12">
                <thead className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="py-3">Item Description / SKU</th>
                        <th className="py-3 text-right">Quantity Received</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {grn.transaction_lines?.map((line: any) => (
                        <tr key={line.id}>
                            <td className="py-4 text-slate-800 font-medium">{line.description}</td>
                            <td className="py-4 text-right text-slate-900 font-bold">{line.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-12 mt-40 pt-8 border-t border-slate-200 text-center">
                <div>
                    <div className="w-48 mx-auto border-b border-slate-400 mb-2"></div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Received By (Warehouse)</p>
                </div>
                <div>
                    <div className="w-48 mx-auto border-b border-slate-400 mb-2"></div>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Quality Inspected By</p>
                </div>
            </div>
        </div>
    );
}