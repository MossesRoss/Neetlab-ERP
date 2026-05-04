"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Download, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStockReport } from '@/actions/reports';

export default function StockReport({ tenantId }: { tenantId: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Fetch real inventory data on component mount
    useEffect(() => {
        const fetchStock = async () => {
            setLoading(true);
            const res = await getStockReport(tenantId, 'ALL');
            if (res.success) {
                setItems(res.data);
            }
            setLoading(false);
        };
        fetchStock();
    }, [tenantId]);

    // Apply real-time search filtering
    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    // Reset to page 1 if the user types a new search query
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Slice the array for the DOM to strictly prevent UI lag
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Calculate Grand Total for the Footer (Operating on FULL dataset, not just the page)
    const grandTotalValue = useMemo(() => {
        return filteredItems.reduce((sum, item) => {
            return sum + (Number(item.stock_quantity || 0) * Number(item.unit_price || 0));
        }, 0);
    }, [filteredItems]);

    // CSV Generation Engine (Full Dataset)
    const handleExportCSV = (e: React.MouseEvent) => {
        e.preventDefault();

        if (isExporting || filteredItems.length === 0) return;
        setIsExporting(true);

        try {
            const headers = ['Code / SKU', 'Item Name', 'Category', 'UOM', 'Min Qty', 'Available Stock', 'Unit Cost (₹)', 'Total Asset Value (₹)'];

            const csvRows = filteredItems.map(item => {
                const minQty = Number(item.min_order_qty || 0);
                const stockQty = Number(item.stock_quantity || 0);
                const unitPrice = Number(item.unit_price || 0);
                const totalValue = stockQty * unitPrice;

                return [
                    `"${item.sku || ''}"`,
                    `"${item.name || ''}"`,
                    `"${item.category || ''}"`,
                    `"${item.uom || ''}"`,
                    minQty,
                    stockQty,
                    unitPrice.toFixed(2),
                    totalValue.toFixed(2)
                ].join(',');
            });

            csvRows.push(`"","GRAND TOTAL","","","","","",${grandTotalValue.toFixed(2)}`);

            const csvString = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Inventory_Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } finally {
            setTimeout(() => setIsExporting(false), 1000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-xl shadow-sm gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Inventory Stock Report</h1>
                    </div>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={loading || isExporting || filteredItems.length === 0}
                    className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading || isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[400px] flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search SKU or Item Name..."
                            className="w-full border border-slate-300 rounded-md py-1.5 pl-9 pr-3 text-sm focus:border-indigo-500 outline-none bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* SARGENT FIX: Pagination moved to Top Header Bar */}
                    {totalPages > 1 && (
                        <div className="flex items-center space-x-4 sm:space-x-6 text-sm text-slate-500">
                            <div className="hidden lg:block">
                                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className="font-bold text-slate-700">{filteredItems.length}</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="font-bold text-slate-700 text-[10px] uppercase tracking-widest px-2">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Code / SKU</th>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4 text-center">UOM</th>
                                <th className="px-6 py-4 text-right">Min Qty</th>
                                <th className="px-6 py-4 text-right">Available Stock</th>
                                <th className="px-6 py-4 text-right">Unit Cost (₹)</th>
                                <th className="px-6 py-4 text-right">Asset Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying Subledger...</p>
                                    </td>
                                </tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                                        <BarChart2 size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium">No stock items found matching your search.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => {
                                    const minQty = Number(item.min_order_qty || 0);
                                    const stockQty = Number(item.stock_quantity || 0);
                                    const unitPrice = Number(item.unit_price || 0);
                                    const isLowStock = stockQty < minQty;
                                    const assetValue = stockQty * unitPrice;

                                    return (
                                        <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-700">{item.sku}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 text-center"><span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-1 rounded">{item.uom}</span></td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500">{minQty.toLocaleString()}</td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {stockQty.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                                                ₹{assetValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                        {!loading && filteredItems.length > 0 && (
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan={6} className="px-6 py-5 text-right font-black uppercase tracking-widest text-xs text-slate-600">
                                        Total Portfolio Valuation:
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-indigo-700 text-base">
                                        ₹{grandTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}