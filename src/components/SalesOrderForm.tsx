"use client";

import React, { useState } from 'react';
import { createSalesOrder } from '@/actions/o2c';
import { Plus, Trash2, Save, FileCheck, Loader2 } from 'lucide-react';

export default function SalesOrderForm({ items, entities, tenantId }: { items: any[], entities: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [customerId, setCustomerId] = useState('');
    const [lines, setLines] = useState([{ id: '1', sku: '', description: '', quantity: 1, unitPrice: 0 }]);

    const customers = entities.filter(e => e.type === 'CUSTOMER');
    const addLine = () => setLines([...lines, { id: crypto.randomUUID(), sku: '', description: '', quantity: 1, unitPrice: 0 }]);
    const updateLine = (id: string, field: string, value: string | number) => setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));

    const handleItemSelect = (id: string, sku: string) => {
        const item = items.find(i => i.sku === sku);
        if (item) setLines(lines.map(l => l.id === id ? { ...l, sku: item.sku, description: `[${item.sku}] ${item.name}`, unitPrice: item.unit_price } : l));
    };

    const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(line => line.id !== id)); };
    const totalAmount = lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.unitPrice)), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const validLines = lines.filter(l => l.description.trim() !== '');
        const response = await createSalesOrder({ tenantId, customerId, lines: validLines });
        if (response.success) window.location.href = '/?module=sales_orders&action=list';
        else { alert(response.error); setLoading(false); }
    };

    return (
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-emerald-950 text-white p-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <FileCheck size={24} className="text-emerald-400" />
                    <div><h2 className="text-lg font-bold tracking-wider uppercase">Create Sales Order</h2></div>
                </div>
                <div className="w-72">
                    <label className="block text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider mb-1">Select Customer</label>
                    <select
                        required
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="w-full bg-emerald-900 border border-emerald-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] pr-8"
                    >
                        <option value="">-- Choose Customer --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-8">
                <form onSubmit={handleSubmit}>
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 w-64">Item Catalog</th>
                                    <th className="p-4">Line Description</th>
                                    <th className="p-4 w-24 text-center">Qty</th>
                                    <th className="p-4 w-32 text-right">Unit Price</th>
                                    <th className="p-4 w-32 text-right">Line Total</th>
                                    <th className="p-4 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line) => (
                                    <tr key={line.id} className="bg-white">
                                        <td className="p-4">
                                            <select
                                                required
                                                value={line.sku}
                                                onChange={(e) => handleItemSelect(line.id, e.target.value)}
                                                className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:border-emerald-500 transition-all text-sm bg-white appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.2em_1.2em] pr-8"
                                            >
                                                <option value="">-- Select Product --</option>
                                                {items.map(item => <option key={item.sku} value={item.sku}>[{item.sku}] {item.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-4"><input required type="text" value={line.description} onChange={(e) => updateLine(line.id, 'description', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm" placeholder="Details..." /></td>
                                        <td className="p-4"><input required type="number" min="1" value={line.quantity} onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))} className="w-full border border-slate-300 rounded-md p-2 text-center text-sm font-mono" /></td>
                                        <td className="p-4"><input required type="number" step="0.01" min="0" value={line.unitPrice} onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))} className="w-full border border-slate-300 rounded-md p-2 text-right text-sm font-mono" /></td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-800">${(Number(line.quantity) * Number(line.unitPrice)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4 text-center"><button type="button" onClick={() => removeLine(line.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                            <button type="button" onClick={addLine} className="flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"><Plus size={14} className="mr-1" /> Add Line</button>
                        </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-200 pt-6">
                        <div className="flex items-center space-x-8">
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
                                <p className="text-3xl font-light font-mono text-slate-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-lg font-bold transition-all shadow-md">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>{loading ? 'Processing...' : 'Submit SO'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}