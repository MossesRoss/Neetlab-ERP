"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, CheckCircle, Loader2, ShieldAlert, PackageCheck, Receipt } from 'lucide-react';
import { updatePurchaseOrderStatus } from '@/actions/p2p';
import { receivePurchaseOrder } from '@/actions/inventory';
import { generateBillFromPO } from '@/actions/billing';

export default function PurchaseOrderList({ orders, tenantId, userRole }: { orders: any[], tenantId: string, userRole: string }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleApprove = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Approve this Purchase Order? It will become a legally binding document ready for vendor dispatch.")) return;

        setLoadingId(id);
        const res = await updatePurchaseOrderStatus(tenantId, id, 'APPROVED');
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    // SARGENT FIX: Receive into Inventory (GRN)
    const handleReceive = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Receive items into inventory? This automatically generates a Goods Receipt Note (GRN) and increases your stock balance.")) return;

        setLoadingId(id);
        const res = await receivePurchaseOrder(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    // SARGENT FIX: Generate Accounts Payable Bill
    const handleBill = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Generate Vendor Bill from this fulfilled order? This will create a liability in Accounts Payable.")) return;

        setLoadingId(id);
        const res = await generateBillFromPO(tenantId, id);
        if (!res.success) alert(res.error);
        setLoadingId(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Purchase Order Ledger</h2>
                    <p className="text-xs text-slate-500 mt-1">Immutable record of all P2P procurement transactions.</p>
                </div>
                <Link
                    href="/?module=purchase_orders&action=create"
                    className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md"
                >
                    <Plus size={16} /> <span>New PO</span>
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Vendor</th>
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
                                    <p>No Purchase Orders found for this tenant.</p>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr
                                    key={order.id}
                                    onClick={() => router.push(`/?module=purchase_orders&action=edit&id=${order.id}`)}
                                    className="hover:bg-sky-50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 font-mono text-xs text-sky-700 font-bold">
                                        PO-{order.transaction_number || order.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{new Date(order.transaction_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{order.entities?.name || 'Unknown Vendor'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'BILLED' ? 'bg-purple-100 text-purple-700 border-purple-200' :
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
                                        {/* SARGENT FIX: The Lifecycle Engine Rendering */}
                                        {order.status === 'PENDING_APPROVAL' ? (
                                            (userRole === 'ADMIN' || Number(order.total_amount) <= 50000) ? (
                                                <button onClick={(e) => handleApprove(e, order.id)} disabled={loadingId === order.id} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                    {loadingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} className="mr-1" />} Approve
                                                </button>
                                            ) : (
                                                <span className="flex items-center justify-center space-x-1 text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                                                    <ShieldAlert size={12} /><span>Requires Admin</span>
                                                </span>
                                            )
                                        ) : order.status === 'APPROVED' ? (
                                            <button onClick={(e) => handleReceive(e, order.id)} disabled={loadingId === order.id} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} className="mr-1" />} Receive GRN
                                            </button>
                                        ) : order.status === 'FULFILLED' ? (
                                            <button onClick={(e) => handleBill(e, order.id)} disabled={loadingId === order.id} className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center mx-auto shadow-sm">
                                                {loadingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <Receipt size={12} className="mr-1" />} Generate Bill
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