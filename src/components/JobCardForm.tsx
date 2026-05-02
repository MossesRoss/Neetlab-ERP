"use client";

import React, { useState } from 'react';
import { createJobCard } from '@/actions/production';
import { Plus, Trash2, Save, Wrench, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function JobCardForm({ items, tenantId }: { items: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ productId: '', quantity: 1, assignedTo: '' });

    // Using string matching instead of select for scale
    const [materials, setMaterials] = useState([{ id: '1', searchStr: '', quantity: 1 }]);

    const finishedGoods = items.filter(i => i.category !== 'RAW_MATERIAL');
    const rawMaterials = items.filter(i => i.category === 'RAW_MATERIAL' || i.category === 'COMPONENT');

    const addMaterial = () => setMaterials([...materials, { id: crypto.randomUUID(), searchStr: '', quantity: 1 }]);
    const updateMaterial = (id: string, field: string, value: string | number) => setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
    const removeMaterial = (id: string) => { if (materials.length > 1) setMaterials(materials.filter(m => m.id !== id)); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Map search strings back to IDs
        const payloadMaterials = materials.map(m => {
            // Extract SKU from "[SKU] Name" format
            const match = m.searchStr.match(/^\[(.*?)\]/);
            const sku = match ? match[1] : '';
            const item = rawMaterials.find(i => i.sku === sku);
            return { materialId: item?.id || '', quantity: m.quantity };
        }).filter(m => m.materialId !== '');

        if (payloadMaterials.length === 0) {
            setError("You must select valid raw materials.");
            setLoading(false);
            return;
        }

        const res = await createJobCard(tenantId, { ...formData, materials: payloadMaterials });
        if (res.success) {
            window.location.href = '/?module=job_cards&action=list';
        } else {
            setError(res.error);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-950 text-white p-6 flex items-center space-x-3">
                <Wrench size={24} className="text-indigo-400" />
                <div>
                    <h2 className="text-lg font-bold tracking-wider uppercase">Issue Job Card</h2>
                    <p className="text-xs text-indigo-200/60 font-mono mt-1">Allocate materials to production.</p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border-b border-rose-200 p-4 flex items-center space-x-2 text-rose-700 text-sm font-bold">
                    <AlertCircle size={16} /> <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Finished Good</label>
                        {/* Datalist for fast searching */}
                        <input required list="finished-goods" value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm placeholder:text-slate-400" placeholder="Type to search products..." />
                        <datalist id="finished-goods">
                            {finishedGoods.map(item => <option key={item.id} value={item.id}>[{item.sku}] {item.name}</option>)}
                        </datalist>
                    </div>
                    {/* ... Rest of Header form (Quantity, Assigned To) remains the same ... */}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden mt-6">
                    <div className="bg-slate-50 p-3 border-b border-slate-200"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Raw Materials Required (BOM)</h3></div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="p-4">Search Material (Code or Name)</th>
                                <th className="p-4 w-32 text-right">Qty to Consume</th>
                                <th className="p-4 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {materials.map((mat) => (
                                <tr key={mat.id} className="bg-white">
                                    <td className="p-4">
                                        {/* SARGENT FIX: Scalable searchable input */}
                                        <input required list="raw-materials" value={mat.searchStr} onChange={e => updateMaterial(mat.id, 'searchStr', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm placeholder:text-slate-300" placeholder="Type to search..." />
                                        <datalist id="raw-materials">
                                            {rawMaterials.map(item => <option key={item.id} value={`[${item.sku}] ${item.name}`}>Stock: {item.stock_quantity}</option>)}
                                        </datalist>
                                    </td>
                                    <td className="p-4"><input required type="number" min="0.01" step="0.01" value={mat.quantity} onChange={e => updateMaterial(mat.id, 'quantity', Number(e.target.value))} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm" /></td>
                                    <td className="p-4 text-center"><button type="button" onClick={() => removeMaterial(mat.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button type="button" onClick={addMaterial} className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"><Plus size={14} className="mr-1" /> Add Material</button>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 border-t border-slate-100 pt-6">
                    <Link href="/?module=job_cards&action=list" className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest">Cancel</Link>
                    <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Issue Job Card</span>
                    </button>
                </div>
            </form>
        </div>
    );
}