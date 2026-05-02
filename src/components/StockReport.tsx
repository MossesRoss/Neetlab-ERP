"use client";

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Loader2, Filter } from 'lucide-react';
import { getStockReport } from '@/actions/reports';

export default function StockReport({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [category, setCategory] = useState('RAW_MATERIAL');

    useEffect(() => {
        fetchReport();
    }, [category]);

    const fetchReport = async () => {
        setLoading(true);
        const res = await getStockReport(tenantId, category);
        if (res.success) setData(res.data);
        setLoading(false);
    };

    const exportToCSV = () => {
        if (data.length === 0) return;

        const headers = ['SKU', 'Item Name', 'UOM', 'Min Qty', 'Available Stock', 'Unit Price ($)'];
        const rows = data.map(item => [
            `"${item.sku}"`,
            `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
            `"${item.uom}"`,
            item.min_order_qty,
            item.stock_quantity,
            item.unit_price
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Stock_Report_${category}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Stock Reports</h1>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Real-time inventory levels & export</p>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    disabled={data.length === 0 || loading}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} /> <span>Export CSV</span>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-4">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="border border-slate-300 rounded-md p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                    >
                        <option value="RAW_MATERIAL">Raw Materials Report</option>
                        <option value="COMPONENT">Components Report</option>
                        <option value="FINISHED_GOOD">Finished Goods Report</option>
                        <option value="ALL">All Items (Master List)</option>
                    </select>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b-2 border-slate-100 text-slate-400 uppercase text-[10px] tracking-widest font-black">
                                <tr>
                                    <th className="px-6 py-4">Code / SKU</th>
                                    <th className="px-6 py-4">Item Name</th>
                                    <th className="px-6 py-4 text-center">UOM</th>
                                    <th className="px-6 py-4 text-right">Min Qty</th>
                                    <th className="px-6 py-4 text-right">Available Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {data.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No records found.</td></tr>
                                ) : (
                                    data.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-mono text-xs font-bold text-slate-700">{item.sku}</td>
                                            <td className="px-6 py-3 font-medium">{item.name}</td>
                                            <td className="px-6 py-3 text-center"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">{item.uom || 'Nos'}</span></td>
                                            <td className="px-6 py-3 text-right font-mono text-xs text-slate-500">{item.min_order_qty || 0}</td>
                                            <td className={`px-6 py-3 text-right font-mono font-bold ${Number(item.stock_quantity) <= Number(item.min_order_qty) ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {item.stock_quantity || 0}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}