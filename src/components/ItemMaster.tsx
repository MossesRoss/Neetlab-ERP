"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Loader2, Box, Search, Filter, Layers, Wrench, Settings, History, X, Upload, AlertCircle, CheckCircle2, Trash2, ChevronLeft, ChevronRight, MoreVertical, CheckSquare } from 'lucide-react';
import { getItemStockHistory, bulkImportItems, bulkDeleteItems } from '@/actions/items';
import Link from 'next/link';

export default function ItemMaster({ items, tenantId }: { items: any[], tenantId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const optionsMenuRef = useRef<HTMLDivElement>(null);

    // UI Layout State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    // Pagination & Selection State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const itemsPerPage = 50;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
                setShowOptionsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => { setCurrentPage(1); setSelectedItems([]); }, [searchQuery, activeTab]);

    const [historyItem, setHistoryItem] = useState<any | null>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const notify = (type: 'error' | 'success', msg: string) => setNotification({ type, msg });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const text = await file.text();
            const rows = text.split('\n').filter(r => r.trim() !== '');
            const parsedItems = rows.slice(1).map(r => r.split(',').map(s => s.trim().replace(/^"|"$/g, ''))).filter(r => r.length >= 2 && r[0]).map(r => ({
                sku: r[0], name: r[1], category: r[2] || 'RAW_MATERIAL', uom: r[3] || 'Nos', minOrderQty: Number(r[4]) || 0, unitPrice: Number(r[5]) || 0
            }));
            if (parsedItems.length === 0) throw new Error("No valid items found.");
            const res = await bulkImportItems(tenantId, parsedItems);
            if (res.success) { notify('success', `Imported ${res.count} records.`); setTimeout(() => window.location.reload(), 1500); }
            else notify('error', res.error);
        } catch (error: any) { notify('error', "CSV Parse Error: " + error.message); }
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleBulkDelete = async () => {
        if (!confirm(`WARNING: Are you sure you want to permanently delete ${selectedItems.length} items?`)) return;
        setLoading(true);
        const res = await bulkDeleteItems(tenantId, selectedItems);
        if (res.success) { notify('success', `Successfully deleted items.`); setSelectedItems([]); setIsSelectionMode(false); window.location.reload(); }
        else notify('error', res.error);
        setLoading(false);
    };

    const openHistory = async (e: React.MouseEvent, item: any) => {
        e.stopPropagation(); // Prevent triggering the row edit click
        setHistoryItem(item);
        setLoadingHistory(true);
        const res = await getItemStockHistory(tenantId, item.id);
        if (res.success) setHistoryData(res.data);
        setLoadingHistory(false);
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesTab = activeTab === 'ALL' || item.category === activeTab;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [items, activeTab, searchQuery]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const tabs = [
        { id: 'ALL', label: 'All Items', icon: Package },
        { id: 'RAW_MATERIAL', label: 'Raw Materials', icon: Layers },
        { id: 'COMPONENT', label: 'Components', icon: Settings },
        { id: 'FINISHED_GOOD', label: 'Finished Goods', icon: Box },
        { id: 'SERVICE', label: 'Services', icon: Wrench }
    ];

    return (
        <div className="space-y-6 relative pb-12">
            {notification && (
                <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between min-w-[320px] animate-in slide-in-from-right-8 ${notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    <div className="flex items-center space-x-3 text-sm font-bold uppercase tracking-wider">
                        {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <span>{notification.msg}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 hover:opacity-75 transition-opacity p-1 bg-black/10 rounded-full"><X size={16} /></button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Package size={24} /></div>
                    <div><h1 className="text-xl font-bold uppercase tracking-wider">Items</h1></div>
                </div>
                <div className="flex items-center space-x-3 relative" ref={optionsMenuRef}>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                    <Link href="/?module=item_master&action=create" className="flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md">
                        <Plus size={16} /> <span>Create Record</span>
                    </Link>

                    <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors shadow-md border border-slate-700">
                        <MoreVertical size={16} />
                    </button>

                    {showOptionsMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                            <button onClick={() => { fileInputRef.current?.click(); setShowOptionsMenu(false); }} disabled={loading} className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                {loading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Upload size={16} className="text-slate-400" />} <span>Import CSV</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-2 w-full md:w-auto">
                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${showFilters ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                <Filter size={14} /> <span>Filter</span>
                            </button>
                            <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedItems([]); }} className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isSelectionMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                <CheckSquare size={14} /> <span>Bulk Actions</span>
                            </button>
                            {isSelectionMode && selectedItems.length > 0 && (
                                <button onClick={handleBulkDelete} disabled={loading} className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md animate-in fade-in zoom-in ml-2">
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} <span>Delete ({selectedItems.length})</span>
                                </button>
                            )}
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                            <input type="text" placeholder="Search code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white" />
                        </div>
                    </div>
                    {showFilters && (
                        <div className="flex flex-wrap gap-2 pt-2 animate-in slide-in-from-top-2 fade-in duration-200 border-t border-slate-200">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase transition-all mt-2 ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700'}`}>
                                    <tab.icon size={12} /><span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white border-b-2 border-slate-100 text-slate-400 uppercase text-[10px] tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                {isSelectionMode && (
                                    <th className="px-6 py-4 w-12 text-center animate-in fade-in slide-in-from-left-2">
                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer" checked={paginatedItems.length > 0 && selectedItems.length === paginatedItems.length} onChange={(e) => e.target.checked ? setSelectedItems(paginatedItems.map((i: any) => i.id)) : setSelectedItems([])} />
                                    </th>
                                )}
                                <th className="px-6 py-4">Code / SKU</th>
                                <th className="px-6 py-4">Item Description</th>
                                <th className="px-6 py-4 text-center">UOM</th>
                                <th className="px-6 py-4 text-right">Min Qty</th>
                                <th className="px-6 py-4 text-right">Available Stock</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={isSelectionMode ? 7 : 6} className="px-6 py-20 text-center text-slate-400">
                                        <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No records found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item: any) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => router.push(`/?module=item_master&action=edit&id=${item.id}`)}
                                        className={`cursor-pointer hover:bg-indigo-50/50 transition-colors group ${selectedItems.includes(item.id) ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        {isSelectionMode && (
                                            <td className="px-6 py-3 text-center animate-in fade-in slide-in-from-left-2" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer" checked={selectedItems.includes(item.id)} onChange={() => setSelectedItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])} />
                                            </td>
                                        )}
                                        <td className="px-6 py-3 font-mono text-xs font-bold text-indigo-700">{item.sku}</td>
                                        <td className="px-6 py-3 font-medium text-slate-900 truncate max-w-xs" title={item.name}>{item.name}</td>
                                        <td className="px-6 py-3 text-center"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">{item.uom || 'Nos'}</span></td>
                                        <td className="px-6 py-3 text-right font-mono text-xs text-slate-500">{Number(item.min_order_qty || 0).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">{Number(item.stock_quantity || 0).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button onClick={(e) => openHistory(e, item)} className="inline-flex items-center justify-center p-2 bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors" title="View Stock Subledger">
                                                <History size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end text-sm text-slate-500 space-x-6">
                        <div className="hidden sm:block">Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className="font-bold text-slate-700">{filteredItems.length}</span></div>
                        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700"><ChevronLeft size={16} /></button>
                            <span className="font-bold text-slate-700 text-[10px] uppercase tracking-widest px-2">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {historyItem && (
                <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setHistoryItem(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-slate-800">Stock Subledger</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">{historyItem.uom}</span>
                                </div>
                                <p className="text-sm text-slate-500 font-mono mt-1"><span className="font-bold text-indigo-600">[{historyItem.sku}]</span> {historyItem.name}</p>
                            </div>
                            <button onClick={() => setHistoryItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Loader2 size={32} className="animate-spin mb-4" /><p className="text-xs font-bold uppercase tracking-widest">Querying Subledger...</p></div>
                            ) : historyData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400"><History size={32} className="mb-4 opacity-30" /><p className="text-xs font-bold uppercase tracking-widest">No verified movements recorded.</p></div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                            <tr><th className="px-6 py-4">Timestamp (UTC)</th><th className="px-6 py-4">Transaction Ref</th><th className="px-6 py-4">Movement Type</th><th className="px-6 py-4 text-right">Net Change</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {historyData.map((record) => {
                                                const isPositive = Number(record.quantity_change) > 0;
                                                return (
                                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{new Date(record.created_at).toLocaleString()}</td>
                                                        <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-700">{record.transactions ? `${record.transactions.type.substring(0, 3)}-${record.transactions.id.split('-')[0].toUpperCase()}` : 'SYSTEM_ADJ'}</td>
                                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{record.movement_type}</span></td>
                                                        <td className={`px-6 py-4 text-right font-mono font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{isPositive ? '+' : ''}{Number(record.quantity_change).toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}