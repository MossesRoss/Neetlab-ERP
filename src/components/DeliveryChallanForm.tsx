"use client";

import React, { useState } from 'react';
import { createDeliveryChallan } from '@/actions/subcontracting';
import { Plus, Trash2, Save, Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DeliveryChallanForm({ items, entities, tenantId }: { items: any[], entities: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [vendorId, setVendorId] = useState('');
    const [lines, setLines] = useState([{ id: '1', itemId: '', quantity: 1 }]);

    const vendors = entities.filter(e => e.type === 'VENDOR');
    const updateLine = (id: string, field: string, value: any) => setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const validLines = lines.filter(l => l.itemId !== '');
        const res = await createDeliveryChallan(tenantId, { vendorId, lines: validLines });
        if (res.success) window.location.href = '/?module=delivery_challans&action=list';
        else { alert(res.error); setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-sky-950 text-white p-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Truck size={24} className="text-sky-400" />
                    <div><h2 className="text-lg font-bold tracking-wider uppercase">Issue Delivery Challan</h2></div>
                </div>
                <select required value={vendorId} onChange={e => setVendorId(e.target.value)} className="w-72 bg-sky-900 border border-sky-800 rounded-md p-2 text-sm outline-none">
                    <option value="">-- Select Subcontractor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="p-4">Material / Item</th>
                            <th className="p-4 w-32">Qty to Send</th>
                            <th className="p-4 w-12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lines.map(line => (
                            <tr key={line.id}>
                                <td className="p-4">
                                    <select required value={line.itemId} onChange={e => updateLine(line.id, 'itemId', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none">
                                        <option value="">-- Select Item --</option>
                                        {items.map(i => <option key={i.id} value={i.id}>[{i.sku}] {i.name} (Stock: {i.stock_quantity})</option>)}
                                    </select>
                                </td>
                                <td className="p-4"><input required type="number" min="0.01" step="0.01" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', Number(e.target.value))} className="w-full border border-slate-300 rounded-md p-2 text-sm font-mono text-right" /></td>
                                <td className="p-4 text-center"><button type="button" onClick={() => setLines(lines.filter(l => l.id !== line.id))} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" onClick={() => setLines([...lines, { id: crypto.randomUUID(), itemId: '', quantity: 1 }])} className="text-xs font-bold text-sky-600 uppercase flex items-center"><Plus size={14} className="mr-1" /> Add Item</button>
                <div className="flex justify-end space-x-4 border-t border-slate-100 pt-6">
                    <Link href="/?module=delivery_challans&action=list" className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase">Cancel</Link>
                    <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase shadow-md">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Issue DC</span>
                    </button>
                </div>
            </form>
        </div>
    );
}