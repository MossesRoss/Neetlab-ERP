"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Package, Loader2, Receipt } from 'lucide-react';
import { receivePurchaseOrder } from '@/actions/inventory';
import { generateBillFromPO } from '@/actions/billing';

export default function PurchaseOrderList({ orders }: { orders: any[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const tenantId = '11111111-1111-1111-1111-111111111111';

    const handleReceive = async (e: React.MouseEvent, poId: string) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!confirm("Are you sure you want to receive these goods into inventory?")) return;

        setLoadingId(poId);
        const result = await receivePurchaseOrder(tenantId, poId);
        if (!result.success) {
            alert("Error receiving goods: " + result.error);
        }
        setLoadingId(null);
    };

    const handleGenerateBill = async (e: React.MouseEvent, poId: string) => {
        e.stopPropagation();
        e.preventDefault();

        if (!confirm("Generate Vendor Bill and post to Ledger (A/P)?")) return;

        setLoadingId(poId);
        const result = await generateBillFromPO(tenantId, poId);
        if (result.success) {
            alert("Bill Generated and Ledger Updated!");
        } else {
            alert("Error: " + result.error);
        }
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
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                            <th className="px-6 py-4 text-center">Actions</th>
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
                                <tr key={order.id} className="hover:bg-sky-50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 font-mono text-xs text-sky-700 font-medium">
                                        {order.id.split('-')[0].toUpperCase()}...
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{order.transaction_date}</td>
                                    <td className="px-6 py-4 font-medium">{order.entities?.name || 'Unknown Vendor'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${
                                            order.status === 'FULFILLED' 
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                            : order.status === 'BILLED'
                                            ? 'bg-sky-100 text-sky-700 border-sky-200'
                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                        }`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                        ${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {order.status === 'PENDING_APPROVAL' && (
                                            <button
                                                onClick={(e) => handleReceive(e, order.id)}
                                                disabled={loadingId === order.id}
                                                className="flex items-center space-x-1 mx-auto bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
                                                title="Receive Goods"
                                            >
                                                {loadingId === order.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Package size={12} />
                                                )}
                                                <span>Receive</span>
                                            </button>
                                        )}
                                        {order.status === 'FULFILLED' && (
                                            <button
                                                onClick={(e) => handleGenerateBill(e, order.id)}
                                                disabled={loadingId === order.id}
                                                className="flex items-center space-x-1 mx-auto bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
                                                title="Generate Vendor Bill"
                                            >
                                                {loadingId === order.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Receipt size={12} />
                                                )}
                                                <span>Bill PO</span>
                                            </button>
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