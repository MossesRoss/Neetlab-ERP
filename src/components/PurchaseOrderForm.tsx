"use client";

import React, { useState } from 'react';
import { createPurchaseOrder } from '@/actions/p2p';
import { Plus, Trash2, Save, ShoppingCart, Loader2 } from 'lucide-react';

export default function PurchaseOrderForm({ items = [], entities = [] }: { items?: any[], entities?: any[] }) {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // No more hardcoded Vendor ID!
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const [vendorId, setVendorId] = useState('');

    const vendors = entities.filter(e => e.type === 'VENDOR');

    const [lines, setLines] = useState([
        { id: '1', sku: '', description: '', quantity: 1, unitPrice: 0 }
    ]);

    const addLine = () => {
        setLines([...lines, { id: crypto.randomUUID(), sku: '', description: '', quantity: 1, unitPrice: 0 }]);
    };

    const updateLine = (id: string, field: string, value: string | number) => {
        setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
    };

    const handleItemSelect = (id: string, selectedSku: string) => {
        const item = items.find(i => i.sku === selectedSku);
        if (item) {
            setLines(lines.map(line =>
                line.id === id ? {
                    ...line,
                    sku: selectedSku,
                    description: `[${item.sku}] ${item.name}`,
                    unitPrice: item.unit_price
                } : line
            ));
        } else {
            updateLine(id, 'sku', '');
            updateLine(id, 'description', '');
            updateLine(id, 'unitPrice', 0);
        }
    };

    // Client-side visual calculation ONLY. The server will recalculate this for security.
    const visualTotal = lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.unitPrice)), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        if (!vendorId) {
            setErrorMsg("Please select a vendor for this Purchase Order.");
            setLoading(false);
            return;
        }

        // Ensure no empty lines are sent
        const validLines = lines.filter(l => l.sku !== '');
        const payload = { tenantId, vendorId, lines: validLines };
        const response = await createPurchaseOrder(payload);

        if (response.success) {
            setSuccessMsg(`PO Created Successfully! Transaction ID: ${response.transactionId}`);
            setLines([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
        } else {
            setErrorMsg(response.error || "Failed to create Purchase Order");
        }

        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <ShoppingCart size={24} className="text-sky-400" />
                    <div>
                        <h2 className="text-lg font-bold tracking-wider uppercase">Create Purchase Order</h2>
                        <p className="text-xs text-slate-400 font-mono mt-1">P2P Procurement Pipeline</p>
                    </div>
                </div>

                {/* New Vendor Selection Dropdown */}
                <div className="w-72">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Vendor</label>
                    <select
                        required
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-sky-500"
                    >
                        <option value="">-- Choose Vendor --</option>
                        {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-8">
                {successMsg && (
                    <div className="mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-md text-sm font-medium">
                        {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-md text-sm font-medium">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 w-1/2">Item Description</th>
                                    <th className="p-4 w-24">Quantity</th>
                                    <th className="p-4 w-32">Unit Price ($)</th>
                                    <th className="p-4 text-right">Line Total</th>
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
                                                className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm bg-white"
                                            >
                                                <option value="">-- Select Item from Catalog --</option>
                                                {items.map(item => (
                                                    <option key={item.id} value={item.sku}>
                                                        [{item.sku}] {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                                                className="w-full border border-slate-300 rounded-md p-2 text-center font-mono focus:outline-none focus:border-sky-500 text-sm"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.unitPrice}
                                                disabled
                                                className="w-full border border-slate-300 rounded-md p-2 text-right font-mono focus:outline-none focus:border-sky-500 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                                            />
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-700 font-medium">
                                            ${(Number(line.quantity) * Number(line.unitPrice)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(line.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={addLine}
                                className="flex items-center text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-wider"
                            >
                                <Plus size={14} className="mr-1" /> Add Line Item
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <div className="text-slate-500 text-xs max-w-sm">
                            <p>Total is calculated dynamically. Upon submission, the server will strictly recalculate pricing for ledger immutability.</p>
                        </div>
                        <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Purchase Value</p>
                                <p className="text-3xl font-light text-slate-900 font-mono">
                                    ${visualTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>{loading ? 'Processing...' : 'Submit PO'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}