"use client";

import React, { useState } from 'react';
import { Package, Save, Loader2, ArrowLeft } from 'lucide-react';
import { createItem, updateItem } from '@/actions/items';
import Link from 'next/link';

export default function ItemForm({ tenantId, initialData }: { tenantId: string, initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        sku: initialData?.sku || '',
        name: initialData?.name || '',
        category: initialData?.category || 'RAW_MATERIAL',
        uom: initialData?.uom || 'Nos',
        minOrderQty: initialData?.min_order_qty || 0,
        unitPrice: initialData?.unit_price || 0,
        openingStock: 0 // SARGENT FIX: QA testing seed
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const response = isEditing
            ? await updateItem(tenantId, initialData.id, formData)
            : await createItem({ ...formData, tenantId });

        if (response.success) {
            window.location.href = '/?module=item_master&action=list';
        } else {
            setErrorMsg(response.error);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
                <Link href="/?module=item_master&action=list" className="hover:text-indigo-600 flex items-center">
                    <ArrowLeft size={16} className="mr-1" /> Back to Items
                </Link>
                <span>/</span>
                <span className="text-slate-800">{isEditing ? `Edit ${initialData.sku}` : 'Create New'}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-indigo-950 text-white p-6 flex items-center space-x-3">
                    <Package size={24} className="text-indigo-400" />
                    <div>
                        <h2 className="text-lg font-bold tracking-wider uppercase">{isEditing ? 'Edit Item Record' : 'Create Item Record'}</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {errorMsg && <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-200">{errorMsg}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Category</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-slate-50 font-medium">
                                <option value="RAW_MATERIAL">Raw Material</option>
                                <option value="COMPONENT">Manufactured Component</option>
                                <option value="FINISHED_GOOD">Finished Good</option>
                                <option value="SERVICE">Service / Labor</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">SKU / Code</label>
                            <input required type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none font-mono uppercase" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Description</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit of Measure (UOM)</label>
                            <input required type="text" value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Nos, Kg, Mtrs" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Min Order Qty (MOQ)</label>
                            <input type="number" step="0.01" value={formData.minOrderQty} onChange={e => setFormData({ ...formData, minOrderQty: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none font-mono" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Standard Cost / Price</label>
                            <input required type="number" step="0.01" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none font-mono" />
                        </div>

                        {/* SARGENT FIX: Clearer UX for Stock Display vs. Stock Injection */}
                        {isEditing ? (
                            <div className="md:col-span-2 md:col-start-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Stock (Immutable)</label>
                                <input
                                    type="number"
                                    value={initialData?.stock_quantity || 0}
                                    disabled
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none font-mono bg-slate-100 text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-[9px] text-slate-400 mt-1 font-medium">Updated via GRNs & Production.</p>
                            </div>
                        ) : (
                            <div className="md:col-span-2 md:col-start-1">
                                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Opening Stock (QA)</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={formData.openingStock}
                                    onChange={e => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                                    className="w-full border border-emerald-200 rounded-lg p-2.5 text-sm outline-none font-mono bg-emerald-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                                <p className="text-[9px] text-slate-400 mt-1 font-medium">Injects ledger balance on creation.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>{isEditing ? 'Save Changes' : 'Create Record'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}