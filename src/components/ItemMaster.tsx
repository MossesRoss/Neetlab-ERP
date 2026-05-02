"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Package, Plus, Save, Loader2, Box, Search, Filter, Layers, Wrench, Settings, History, X, Upload } from 'lucide-react';
import { createItem, getItemStockHistory, bulkImportItems } from '@/actions/items';

export default function ItemMaster({ items }: { items: any[] }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('RAW_MATERIAL'); // ADD THIS BACK

    // NEW: Phase 32 History State
    const [historyItem, setHistoryItem] = useState<any | null>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Core ERP Data Structure
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: 'RAW_MATERIAL',
        uom: 'Nos',
        minOrderQty: 0,
        unitPrice: 0
    });

    const tenantId = '11111111-1111-1111-1111-111111111111';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const response = await createItem({ ...formData, tenantId });
        if (response.success) {
            setShowForm(false);
            setFormData({ sku: '', name: '', category: activeTab, uom: 'Nos', minOrderQty: 0, unitPrice: 0 });
        } else {
            alert("Error: " + response.error);
        }
        setLoading(false);
    };

    // Client-side filtering for blazing fast UX
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesTab = activeTab === 'ALL' || item.category === activeTab;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [items, activeTab, searchQuery]);

    const tabs = [
        { id: 'RAW_MATERIAL', label: 'Raw Materials', icon: Layers },
        { id: 'COMPONENT', label: 'Components', icon: Settings },
        { id: 'FINISHED_GOOD', label: 'Finished Goods', icon: Box },
        { id: 'SERVICE', label: 'Services', icon: Wrench },
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const text = await file.text();
            // Basic CSV parser: splits by newline, then comma (ignoring quotes for simplicity)
            const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));

            // Expected Header: SKU, Name, Category, UOM, MinQty, UnitPrice
            const parsedItems = rows.slice(1).filter(r => r.length >= 2 && r[0]).map(r => ({
                sku: r[0],
                name: r[1],
                category: r[2] || 'RAW_MATERIAL',
                uom: r[3] || 'Nos',
                minOrderQty: Number(r[4]) || 0,
                unitPrice: Number(r[5]) || 0
            }));

            if (parsedItems.length === 0) throw new Error("No valid items found.");

            const res = await bulkImportItems(tenantId, parsedItems);
            if (res.success) {
                alert(`Success: Imported ${res.count} records.`);
                window.location.reload();
            } else {
                alert("Import failed: " + res.error);
            }
        } catch (error: any) {
            alert("Error parsing CSV: " + error.message);
        }
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openHistory = async (item: any) => {
        setHistoryItem(item);
        setLoadingHistory(true);
        const res = await getItemStockHistory(tenantId, item.id);
        if (res.success) setHistoryData(res.data);
        setLoadingHistory(false);
    };

    return (
        <div className="space-y-6">
            {/* Enterprise Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Master Item Catalog</h1>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Centralized inventory & material definitions.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} <span>Import CSV</span>
                    </button>
                    <button
                        onClick={() => {
                            setFormData(prev => ({ ...prev, category: activeTab === 'ALL' ? 'RAW_MATERIAL' : activeTab }));
                            setShowForm(!showForm);
                        }}
                        className="flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md"
                    >
                        <Plus size={16} /> <span>Create Record</span>
                    </button>
                </div>
            </div>

            {/* Creation Form */}
            {showForm && (
                <div className="bg-white border border-indigo-200 rounded-xl p-8 shadow-sm animate-in slide-in-from-top-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 border-b pb-2 flex items-center">
                        <Plus size={18} className="mr-2 text-indigo-500" /> New Catalog Entry
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none bg-slate-50 font-medium"
                            >
                                <option value="RAW_MATERIAL">Raw Material</option>
                                <option value="COMPONENT">Manufactured Component</option>
                                <option value="FINISHED_GOOD">Finished Good</option>
                                <option value="SERVICE">Service / Labor</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">SKU / Code</label>
                            <input required type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none font-mono uppercase" placeholder="RM-101" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Description</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none" placeholder="Aluminium Pipe 6000x20x3.2mm" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit of Measure (UOM)</label>
                            <select value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none bg-white">
                                <option value="Nos">Numbers (Nos)</option>
                                <option value="Kg">Kilograms (Kg)</option>
                                <option value="Mtrs">Meters (Mtrs)</option>
                                <option value="Ltrs">Liters (Ltrs)</option>
                                <option value="Hrs">Hours (Hrs)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Min Order Qty (MOQ)</label>
                            <input type="number" step="0.01" min="0" value={formData.minOrderQty} onChange={e => setFormData({ ...formData, minOrderQty: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Standard Cost / Price</label>
                            <input required type="number" step="0.01" min="0" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none font-mono" />
                        </div>

                        <div className="md:col-span-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest">Cancel</button>
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Save Record</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Data Grid */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                {/* Grid Tools */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                <tab.icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search code or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Grid Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white border-b-2 border-slate-100 text-slate-400 uppercase text-[10px] tracking-widest font-black sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Code / SKU</th>
                                <th className="px-6 py-4">Item Description</th>
                                <th className="px-6 py-4 text-center">UOM</th>
                                <th className="px-6 py-4 text-right">Min Qty</th>
                                <th className="px-6 py-4 text-right">Available Stock</th>
                                <th className="px-6 py-4 text-right">Unit Price</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                                        <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No records found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-3 font-mono text-xs font-bold text-indigo-700">{item.sku}</td>
                                        <td className="px-6 py-3 font-medium text-slate-900 truncate max-w-xs" title={item.name}>{item.name}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">
                                                {item.uom || 'Nos'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-xs text-slate-500">
                                            {Number(item.min_order_qty || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">
                                            {Number(item.stock_quantity || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-sm text-slate-600">
                                            ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={() => openHistory(item)}
                                                className="inline-flex items-center justify-center p-2 bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors"
                                                title="View Stock Subledger"
                                            >
                                                <History size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PHASE 32: IMMUTABLE SUBLEDGER MODAL */}
            {historyItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-slate-800">Stock Subledger</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">{historyItem.uom}</span>
                                </div>
                                <p className="text-sm text-slate-500 font-mono mt-1"><span className="font-bold text-indigo-600">[{historyItem.sku}]</span> {historyItem.name}</p>
                            </div>
                            <button onClick={() => setHistoryItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Querying Subledger...</p>
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <History size={32} className="mb-4 opacity-30" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No verified movements recorded.</p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Timestamp (UTC)</th>
                                                <th className="px-6 py-4">Transaction Ref</th>
                                                <th className="px-6 py-4">Movement Type</th>
                                                <th className="px-6 py-4 text-right">Net Change</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {historyData.map((record) => {
                                                const isPositive = Number(record.quantity_change) > 0;
                                                return (
                                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                            {new Date(record.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-700">
                                                            {record.transactions ? `${record.transactions.type.substring(0, 3)}-${record.transactions.id.split('-')[0].toUpperCase()}` : 'SYSTEM_ADJ'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                }`}>
                                                                {record.movement_type}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right font-mono font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {isPositive ? '+' : ''}{Number(record.quantity_change).toLocaleString()}
                                                        </td>
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