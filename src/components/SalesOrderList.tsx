"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Receipt, Loader2, PackageMinus } from 'lucide-react';
import { generateInvoiceFromSO } from '@/actions/billing';
import { fulfillSalesOrder } from '@/actions/inventory';

export default function SalesOrderList({ orders, tenantId }: { orders: any[], tenantId: string }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleFulfill = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        if (!confirm("Fulfill this order? This will deduct stock from the warehouse.")) return;
        
        setLoadingId(orderId);
        const res = await fulfillSalesOrder(tenantId, orderId);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    const handleInvoice = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        setLoadingId(orderId);
        const res = await generateInvoiceFromSO(tenantId, orderId);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Sales Order Ledger</h2>
                    <p className="text-xs text-slate-500 mt-1">Immutable record of all O2C revenue transactions.</p>
                </div>
                <Link
                    href="/?module=sales_orders&action=create"
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md"
                >
                    <Plus size={16} /> <span>New SO</span>
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>No Sales Orders found for this tenant.</p>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-emerald-50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs text-emerald-700 font-medium">
                                        {order.id.split('-')[0].toUpperCase()}...
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{order.transaction_date}</td>
                                    <td className="px-6 py-4 font-medium">{order.entities?.name || 'Unknown Customer'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${
                                            order.status === 'INVOICED' ? 'bg-sky-100 text-sky-700 border-sky-200' : 
                                            order.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            'bg-amber-100 text-amber-700 border-amber-200'
                                        }`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                        ${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                                        {order.status === 'PENDING_FULFILLMENT' && (
                                            <button
                                                onClick={(e) => handleFulfill(e, order.id)}
                                                disabled={loadingId === order.id}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center"
                                            >
                                                {loadingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <PackageMinus size={14} className="mr-1" />}
                                                Fulfill
                                            </button>
                                        )}
                                        
                                        {order.status === 'FULFILLED' && (
                                            <button
                                                onClick={(e) => handleInvoice(e, order.id)}
                                                disabled={loadingId === order.id}
                                                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center"
                                            >
                                                {loadingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} className="mr-1" />}
                                                Invoice
                                            </button>
                                        )}

                                        {order.status === 'INVOICED' && (
                                            <span className="text-xs text-slate-400 font-medium uppercase py-1.5">Completed</span>
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