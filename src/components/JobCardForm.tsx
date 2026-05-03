"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createJobCard } from '@/actions/production';
import { Plus, Trash2, Save, Wrench, Loader2, ChevronDown } from 'lucide-react';

const CustomCombobox = ({ value, onChange, options, placeholder }: any) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter((o: any) => o.label.toLowerCase().includes(query.toLowerCase()));
    const selectedLabel = options.find((o: any) => o.value === value)?.label || '';

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div onClick={() => setOpen(!open)} className="w-full border border-slate-300 rounded-md p-2.5 text-sm bg-white cursor-pointer flex justify-between items-center hover:border-indigo-400 transition-colors">
                <span className={selectedLabel ? 'text-slate-900 font-medium' : 'text-slate-400'}>{selectedLabel || placeholder}</span>
                <ChevronDown size={16} className="text-slate-400" />
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input autoFocus type="text" className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-indigo-500" placeholder="Type to search..." value={query} onChange={e => setQuery(e.target.value)} />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.map((o: any) => (
                            <div key={o.value} className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0" onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}>
                                {o.label}
                            </div>
                        ))}
                        {filtered.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">No matches found</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function JobCardForm({ items, tenantId }: { items: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ productId: '', quantity: 1, assignedTo: '' });
    const [materials, setMaterials] = useState([{ id: '1', materialId: '', quantity: 1 }]);

    const finishedGoods = items.filter(i => i.category !== 'RAW_MATERIAL');
    const rawMaterials = items.filter(i => i.category === 'RAW_MATERIAL' || i.category === 'COMPONENT');

    const fgOptions = finishedGoods.map(i => ({ value: i.id, label: `[${i.sku}] ${i.name}` }));
    const rmOptions = rawMaterials.map(i => ({ value: i.id, label: `[${i.sku}] ${i.name} (Stock: ${i.stock_quantity})` }));

    const updateMaterial = (id: string, field: string, val: any) => setMaterials(materials.map(m => m.id === id ? { ...m, [field]: val } : m));
    const removeMaterial = (id: string) => setMaterials(materials.filter(m => m.id !== id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const payloadMaterials = materials.filter(m => m.materialId !== '');
        if (payloadMaterials.length === 0) {
            setError("You must select valid raw materials.");
            setLoading(false); return;
        }

        const res = await createJobCard(tenantId, { ...formData, materials: payloadMaterials });
        if (res.success) window.location.href = '/?module=job_cards&action=list';
        else setError(res.error);

        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-950 text-white p-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Wrench size={24} className="text-indigo-400" />
                    <div><h2 className="text-lg font-bold tracking-wider uppercase">Issue Job Card</h2></div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Finished Good</label>
                        <CustomCombobox value={formData.productId} onChange={(val: string) => setFormData({ ...formData, productId: val })} options={fgOptions} placeholder="Select Target Product..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantity to Produce</label>
                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm outline-none focus:border-indigo-500 font-mono" />
                    </div>
                </div>
                <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden mt-6">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="p-4">Raw Materials Required (BOM)</th>
                            <th className="p-4 w-32">Qty to Consume</th>
                            <th className="p-4 w-12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {materials.map((mat) => (
                            <tr key={mat.id} className="bg-white">
                                <td className="p-4">
                                    <CustomCombobox value={mat.materialId} onChange={(val: string) => updateMaterial(mat.id, 'materialId', val)} options={rmOptions} placeholder="Select Raw Material..." />
                                </td>
                                <td className="p-4"><input required type="number" min="0.01" step="0.01" value={mat.quantity} onChange={e => updateMaterial(mat.id, 'quantity', Number(e.target.value))} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm" /></td>
                                <td className="p-4 text-center"><button type="button" onClick={() => removeMaterial(mat.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" onClick={() => setMaterials([...materials, { id: crypto.randomUUID(), materialId: '', quantity: 1 }])} className="text-xs font-bold text-indigo-600 uppercase flex items-center mt-2"><Plus size={14} className="mr-1" /> Add Material</button>
                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase shadow-md">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Issue Job Card</span>
                    </button>
                </div>
            </form>
        </div>
    );
}