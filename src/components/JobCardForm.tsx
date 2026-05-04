"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createJobCard, updateJobCard } from '@/actions/production';
import { Plus, Trash2, Save, Wrench, Loader2, ChevronDown, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const CustomCombobox = ({ value, onChange, options }: any) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter((o: any) => o.label.toLowerCase().includes(query.toLowerCase()));
    const selectedLabel = options.find((o: any) => o.value === value)?.label || '';

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div onClick={() => setOpen(!open)} className="w-full border border-slate-300 rounded-md p-2.5 text-sm bg-white cursor-pointer flex justify-between items-center hover:border-indigo-400 transition-colors h-10">
                <span className={selectedLabel ? 'text-slate-900 font-medium truncate pr-4' : 'text-slate-400'}>
                    {selectedLabel || '\u00A0'}
                </span>
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input autoFocus type="text" className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-indigo-500" value={query} onChange={e => setQuery(e.target.value)} />
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

export default function JobCardForm({ items, entities, users, tenantId, initialData }: { items: any[], entities: any[], users: any[], tenantId: string, initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        customerId: initialData?.customer_id || '',
        productId: initialData?.product_id || '',
        quantity: initialData?.quantity || '',
        assignedTo: initialData?.assigned_to || '',
        overallDiscount: initialData?.overall_discount || ''
    });

    // Default to EXEMPT for Indian GST Logic
    const [materials, setMaterials] = useState(
        initialData?.job_card_materials?.length > 0
            ? initialData.job_card_materials.map((m: any) => ({
                id: crypto.randomUUID(),
                materialId: m.material_id,
                quantity: m.quantity_required,
                unitPrice: m.unit_price || 0,
                discountRate: m.discount_rate || 0,
                taxCode: m.tax_rate === 28 ? 'GST28' : m.tax_rate === 18 ? 'GST18' : m.tax_rate === 12 ? 'GST12' : m.tax_rate === 5 ? 'GST5' : 'EXEMPT',
                taxRate: m.tax_rate || 0
            }))
            : [{ id: '1', materialId: '', quantity: '', unitPrice: '', discountRate: '', taxCode: 'EXEMPT', taxRate: 0 }]
    );

    const fgOptions = items.map(i => ({ value: i.id, label: `[${i.sku}] ${i.name}` }));
    const rmOptions = items.map(i => ({ value: i.id, label: `[${i.sku}] ${i.name} (Stock: ${i.stock_quantity})` }));
    const customerOptions = entities.filter(e => e.type === 'CUSTOMER').map(c => ({ value: c.id, label: c.name }));
    const userOptions = users.map(u => ({ value: u.id, label: u.name || u.email }));

    const updateMaterial = (id: string, field: string, val: any) => setMaterials(materials.map(m => m.id === id ? { ...m, [field]: val } : m));
    const removeMaterial = (id: string) => setMaterials(materials.filter(m => m.id !== id));

    const handleItemSelect = (id: string, materialId: string) => {
        const item = items.find(i => i.id === materialId);
        setMaterials(materials.map(m => m.id === id ? { ...m, materialId, unitPrice: item?.unit_price || 0 } : m));
    };

    const handleTaxChange = (id: string, code: string) => {
        const rate = code === 'GST28' ? 28 : code === 'GST18' ? 18 : code === 'GST12' ? 12 : code === 'GST5' ? 5 : 0;
        setMaterials(materials.map(m => m.id === id ? { ...m, taxCode: code, taxRate: rate } : m));
    };

    const getLineTotal = (mat: any) => {
        const sub = (Number(mat.quantity) || 0) * (Number(mat.unitPrice) || 0);
        const afterDisc = sub * (1 - (Number(mat.discountRate) || 0) / 100);
        return afterDisc * (1 + (Number(mat.taxRate) || 0) / 100);
    };

    const getLineDiscAmt = (mat: any) => {
        const sub = (Number(mat.quantity) || 0) * (Number(mat.unitPrice) || 0);
        return sub * ((Number(mat.discountRate) || 0) / 100);
    };

    const subtotal = materials.reduce((sum, m) => sum + getLineTotal(m), 0);
    const overallDiscountAmt = subtotal * ((Number(formData.overallDiscount) || 0) / 100);
    const totalJobAmount = subtotal - overallDiscountAmt;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const payloadMaterials = materials.filter(m => m.materialId !== '');
        const payload = { ...formData, materials: payloadMaterials };
        const res = isEditing ? await updateJobCard(tenantId, initialData.id, payload) : await createJobCard(tenantId, payload);

        if (res.success) window.location.href = '/?module=job_cards&action=list';
        else setError(res.error);

        setLoading(false);
    };

    const STATUS_STEPS = ['QUOTE', 'ACCEPTED', 'ACTIVE', 'PENDING_APPROVAL', 'COMPLETED'];
    const currentStatus = initialData?.status || 'QUOTE';
    const currentIdx = STATUS_STEPS.indexOf(currentStatus);

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium pb-2 border-b border-slate-200">
                <Link href="/?module=job_cards&action=list" className="hover:text-indigo-600 flex items-center transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Ledger
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-bold uppercase tracking-wider">{isEditing ? `JOB-${initialData.job_number || initialData.id.split('-')[0].toUpperCase()}` : 'New Quote'}</span>
            </div>

            {/* SARGENT FIX: items-start forces perfect top-alignment of the two columns */}
            <div className="flex flex-col lg:flex-row gap-6 w-full items-start animate-in fade-in slide-in-from-bottom-4">

                {/* LEFT PANE: Sticky Status Tracker */}
                <div className="w-full lg:w-72 flex-shrink-0 sticky top-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Workflow Status</h3>
                        <div className="space-y-6">
                            {STATUS_STEPS.map((step, idx) => {
                                const isCompleted = idx < currentIdx;
                                const isActive = idx === currentIdx;
                                return (
                                    <div key={step} className="flex items-start">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                    isActive ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-300'
                                                }`}>
                                                {isCompleted ? <CheckCircle2 size={12} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                            </div>
                                            {idx !== STATUS_STEPS.length - 1 && (
                                                <div className={`w-0.5 h-10 mt-2 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                                            )}
                                        </div>
                                        <div className="pt-1">
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-indigo-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                                {step.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Full Width Form */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-0">
                    <div className="bg-indigo-950 text-white p-6 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Wrench size={24} className="text-indigo-400" />
                            <div><h2 className="text-lg font-bold tracking-wider uppercase">{isEditing ? 'Modify Job Definition' : 'Issue Job Quote'}</h2></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-lg text-sm font-bold border border-rose-200">{error}</div>}

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                    Customer Link
                                    {formData.customerId && (
                                        <Link href={`/?module=entity_directory&action=edit&id=${formData.customerId}`} target="_blank" className="ml-2 text-indigo-500 hover:text-indigo-700 transition-colors">
                                            <ExternalLink size={14} />
                                        </Link>
                                    )}
                                </label>
                                <CustomCombobox value={formData.customerId} onChange={(val: string) => setFormData({ ...formData, customerId: val })} options={customerOptions} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign Technician</label>
                                <CustomCombobox value={formData.assignedTo} onChange={(val: string) => setFormData({ ...formData, assignedTo: val })} options={userOptions} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Output Object</label>
                                <CustomCombobox value={formData.productId} onChange={(val: string) => setFormData({ ...formData, productId: val })} options={fgOptions} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Qty</label>
                                <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm outline-none focus:border-indigo-500 font-mono h-10" />
                            </div>
                        </div>

                        {/* Section: Horizontally Scrollable BOM */}
                        <div className="w-full border border-slate-200 rounded-lg shadow-sm bg-white">
                            <div className="overflow-x-auto min-h-[350px]">
                                <table className="w-full text-left text-sm min-w-[1000px]">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                        <tr>
                                            <th className="p-4">Line Items</th>
                                            <th className="p-4 w-20">Qty</th>
                                            <th className="p-4 w-24">Rate (₹)</th>
                                            <th className="p-4 w-20">Disc (%)</th>
                                            <th className="p-4 w-24 text-right">Disc Amt</th>
                                            <th className="p-4 w-32">Tax Code</th>
                                            <th className="p-4 w-28 text-right">Amount</th>
                                            <th className="p-4 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {materials.map((mat) => (
                                            <tr key={mat.id} className="bg-white">
                                                <td className="p-4">
                                                    <CustomCombobox value={mat.materialId} onChange={(val: string) => handleItemSelect(mat.id, val)} options={rmOptions} />
                                                </td>
                                                <td className="p-4"><input required type="number" min="0.01" step="0.01" value={mat.quantity} onChange={e => updateMaterial(mat.id, 'quantity', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm focus:border-indigo-500 outline-none h-10" /></td>
                                                <td className="p-4"><input type="number" min="0" step="0.01" value={mat.unitPrice} onChange={e => updateMaterial(mat.id, 'unitPrice', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm focus:border-indigo-500 outline-none h-10" /></td>
                                                <td className="p-4"><input type="number" min="0" max="100" step="0.01" value={mat.discountRate} onChange={e => updateMaterial(mat.id, 'discountRate', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm focus:border-indigo-500 outline-none h-10" /></td>

                                                {/* SARGENT FIX: Read-only auto-calculated Discount Amount field */}
                                                <td className="p-4 text-right font-mono text-rose-500 bg-slate-50/50 rounded-md font-medium">
                                                    ₹{getLineDiscAmt(mat).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                <td className="p-4">
                                                    <select value={mat.taxCode} onChange={e => handleTaxChange(mat.id, e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-indigo-500 outline-none bg-white h-10">
                                                        <option value="EXEMPT">Exempt (0%)</option>
                                                        <option value="GST5">GST (5%)</option>
                                                        <option value="GST12">GST (12%)</option>
                                                        <option value="GST18">GST (18%)</option>
                                                        <option value="GST28">GST (28%)</option>
                                                    </select>
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-slate-800">₹{getLineTotal(mat).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-center"><button type="button" onClick={() => removeMaterial(mat.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-50"><Trash2 size={16} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-3 bg-white border-t border-slate-100">
                                <button type="button" onClick={() => setMaterials([...materials, { id: crypto.randomUUID(), materialId: '', quantity: '', unitPrice: '', discountRate: '', taxCode: 'EXEMPT', taxRate: 0 }])} className="text-xs font-bold text-indigo-600 uppercase flex items-center hover:text-indigo-800 transition-colors"><Plus size={14} className="mr-1" /> Add Item</button>
                            </div>
                        </div>

                        {/* Section: Financial Totals */}
                        <div className="flex justify-end pt-4">
                            <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Subtotal</span>
                                    <span className="text-slate-800 font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Overall Discount (%)</span>
                                    <input type="number" min="0" max="100" step="0.01" value={formData.overallDiscount} onChange={e => setFormData({ ...formData, overallDiscount: e.target.value })} className="w-20 border border-slate-300 rounded p-1.5 text-right font-mono text-xs focus:border-indigo-500 outline-none" />
                                </div>
                                <div className="flex justify-between items-center text-lg font-black pt-3 border-t border-slate-200">
                                    <span className="uppercase tracking-wider text-xs">Total Amount</span>
                                    <span className="text-indigo-600 font-mono">₹{totalJobAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-6 border-t border-slate-200">
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>{isEditing ? 'Save Changes' : 'Draft Job Quote'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}