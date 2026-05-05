"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Receipt, Loader2, CheckCircle, PackageCheck, ShieldAlert } from 'lucide-react';
import { updateSalesOrderStatus } from '@/actions/o2c';
import { fulfillSalesOrder } from '@/actions/inventory';
import { generateInvoiceFromSO } from '@/actions/billing';

export default function SalesOrderList({ orders, tenantId, userRole }: { orders: any[], tenantId: string, userRole: string }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleApprove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Approve this Sales Order? It will be sent to the warehouse for fulfillment.")) return;
        setLoadingId(id);
        const res = await updateSalesOrderStatus(tenantId, id, 'APPROVED');
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    const handleFulfill = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Fulfill order? This will deduct the inventory from stock.")) return;
        setLoadingId(id);
        const res = await fulfillSalesOrder(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    const handleInvoice = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Generate Invoice? This will hit the A/R Ledger.")) return;
        setLoadingId(id);
        const res = await generateInvoiceFromSO(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Sales Order Ledger</h2>
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
                            <th className="px-6 py-4">Customer PO #</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                            <th className="px-6 py-4 text-center">Next Action</th>
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
                                <tr
                                    key={order.id}
                                    onClick={() => router.push(`/?module=sales_orders&action=edit&id=${order.id}`)}
                                    className="hover:bg-emerald-50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-mono text-xs text-emerald-700 font-bold">
                                        SO-{order.transaction_number || order.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{order.external_reference || '—'}</td>
                                    <td className="px-6 py-4 font-medium">{order.entities?.name || 'Unknown Customer'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'INVOICED' ? 'bg-sky-100 text-sky-700 border-sky-200' :
                                            order.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                order.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                    'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                        ₹{Number(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                        {order.status === 'PENDING_APPROVAL' ? (
                                            (userRole === 'ADMIN' || Number(order.total_amount) <= 100000) ? (
                                                <button onClick={(e) => handleApprove(e, order.id)} disabled={loadingId === order.id} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                    {loadingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} className="mr-1" />} Approve
                                                </button>
                                            ) : (
                                                <span className="flex items-center justify-center space-x-1 text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                                                    <ShieldAlert size={12} /><span>Requires Admin</span>
                                                </span>
                                            )
                                        ) : order.status === 'APPROVED' ? (
                                            <button onClick={(e) => handleFulfill(e, order.id)} disabled={loadingId === order.id} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} className="mr-1" />} Fulfill
                                            </button>
                                        ) : order.status === 'FULFILLED' ? (
                                            <button onClick={(e) => handleInvoice(e, order.id)} disabled={loadingId === order.id} className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <Receipt size={12} className="mr-1" />} Invoice
                                            </button>
                                        ) : (
                                            <span className="text-slate-300 text-lg leading-none">&middot;</span>
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