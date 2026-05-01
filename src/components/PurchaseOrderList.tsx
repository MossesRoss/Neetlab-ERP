import React from 'react';
import Link from 'next/link';
import { Plus, Search, FileText } from 'lucide-react';

export default function PurchaseOrderList({ orders }: { orders: any[] }) {
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wider">
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                        ${Number(order.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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