"use client";

import React, { useState } from 'react';
import { Package, Plus, Save, Loader2, Box } from 'lucide-react';
import { createItem } from '@/actions/items';

export default function ItemMaster({ items }: { items: any[] }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ sku: '', name: '', type: 'INVENTORY', unitPrice: 0 });

    const tenantId = '11111111-1111-1111-1111-111111111111';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const response = await createItem({ ...formData, tenantId });
        if (response.success) {
            setShowForm(false);
            setFormData({ sku: '', name: '', type: 'INVENTORY', unitPrice: 0 });
        } else {
            alert("Error: " + response.error); // Simple error handling for prototype
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Create Form Toggle */}
            {showForm && (
                <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Add New Item</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU</label>
                            <input required type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-amber-500 outline-none" placeholder="E.g. PRD-001" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-amber-500 outline-none" placeholder="Description" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-amber-500 outline-none">
                                <option value="INVENTORY">Inventory Part</option>
                                <option value="SERVICE">Service</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Price</label>
                            <input required type="number" step="0.01" min="0" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-amber-500 outline-none" />
                        </div>
                        <div className="md:col-span-5 flex justify-end space-x-3 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-md">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Save Item</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-amber-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-700"><Package size={20} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Item Master Catalog</h2>
                            <p className="text-xs text-slate-500 mt-1">Centralized product and service definitions.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md">
                        <Plus size={16} /> <span>New Item</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Stock Qty</th>
                                <th className="px-6 py-4 text-right">Default Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Box size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No items found in the master catalog.</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-amber-700">{item.sku}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                            {Number(item.stock_quantity || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                            ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}