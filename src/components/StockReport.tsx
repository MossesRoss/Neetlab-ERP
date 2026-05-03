"use client";

import React, { useState } from 'react';
import { BarChart2, Download, Search } from 'lucide-react';

export default function StockReport({ tenantId }: { tenantId: string }) {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-6">
            {/* SARGENT FIX: Added missing Enterprise Header to lock UI layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-xl shadow-sm gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Inventory Stock Report</h1>
                        <p className="text-xs text-slate-500 mt-1 font-mono">Real-time Valuation & Stock Levels</p>
                    </div>
                </div>
                <button className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md">
                    <Download size={16} /> <span>Export CSV</span>
                </button>
            </div>

            {/* Report Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="relative w-72">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search SKU or Item Name..."
                            className="w-full border border-slate-300 rounded-md py-1.5 pl-9 pr-3 text-sm focus:border-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Code / SKU</th>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">UOM</th>
                                <th className="px-6 py-4 text-right">Min Qty</th>
                                <th className="px-6 py-4 text-right">Available Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {/* In a real phase, map your actual stock data here. Mocked for layout confirmation. */}
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-slate-900">RM-001</td>
                                <td className="px-6 py-4">Aluminum Plate Grade A</td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">KGS</td>
                                <td className="px-6 py-4 text-right font-mono text-slate-500">100</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">450</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-slate-900">RM-002</td>
                                <td className="px-6 py-4">Steel Rod 5mm</td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">NOS</td>
                                <td className="px-6 py-4 text-right font-mono text-slate-500">500</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-500">120</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}