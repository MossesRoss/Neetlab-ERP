"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPurchaseOrder, updatePurchaseOrder } from '@/actions/p2p';
import { Plus, Trash2, Save, ShoppingCart, Loader2, ChevronDown, ArrowLeft, ExternalLink, CheckCircle2, Printer } from 'lucide-react';
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
            <div onClick={() => setOpen(!open)} className="w-full border border-slate-300 rounded-md p-2.5 text-sm bg-white cursor-pointer flex justify-between items-center hover:border-sky-400 transition-colors h-10">
                <span className={selectedLabel ? 'text-slate-900 font-medium truncate pr-4' : 'text-slate-400'}>{selectedLabel || '\u00A0'}</span>
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input autoFocus type="text" className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-sky-500" value={query} onChange={e => setQuery(e.target.value)} />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.map((o: any) => (
                            <div key={o.value} className="px-4 py-2.5 text-sm hover:bg-sky-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0" onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}>
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

export default function PurchaseOrderForm({ items, entities, tenantId, initialData }: { items: any[], entities: any[], tenantId: string, initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        vendorId: initialData?.entity_id || '',
        overallDiscount: initialData?.overall_discount || '',
        shippingAmount: initialData?.shipping_amount || '' // SARGENT FIX: Landed Costs
    });

    const [lines, setLines] = useState(
        initialData?.transaction_lines?.length > 0
            ? initialData.transaction_lines.map((m: any) => {
                const match = m.description.match(/\[(.*?)\]/);
                const sku = match ? match[1] : '';
                return {
                    id: crypto.randomUUID(),
                    sku: sku,
                    description: m.description,
                    quantity: m.quantity,
                    unitPrice: m.unit_price || 0,
                    discountRate: m.discount_rate || 0,
                    taxCode: m.tax_rate === 28 ? 'GST28' : m.tax_rate === 18 ? 'GST18' : m.tax_rate === 12 ? 'GST12' : m.tax_rate === 5 ? 'GST5' : 'EXEMPT',
                    taxRate: m.tax_rate || 0
                };
            })
            : [{ id: '1', sku: '', description: '', quantity: '', unitPrice: '', discountRate: '', taxCode: 'EXEMPT', taxRate: 0 }]
    );

    const rmOptions = items.map(i => ({ value: i.sku, label: `[${i.sku}] ${i.name} (Stock: ${i.stock_quantity})` }));
    const vendorOptions = entities.filter(e => e.type === 'VENDOR').map(c => ({ value: c.id, label: c.name }));

    const updateLine = (id: string, field: string, val: any) => setLines(lines.map(m => m.id === id ? { ...m, [field]: val } : m));
    const removeLine = (id: string) => setLines(lines.filter(m => m.id !== id));

    const handleItemSelect = (id: string, sku: string) => {
        const item = items.find(i => i.sku === sku);
        setLines(lines.map(m => m.id === id ? { ...m, sku, description: `[${item.sku}] ${item.name}`, unitPrice: item?.unit_price || 0 } : m));
    };

    const handleTaxChange = (id: string, code: string) => {
        const rate = code === 'GST28' ? 28 : code === 'GST18' ? 18 : code === 'GST12' ? 12 : code === 'GST5' ? 5 : 0;
        setLines(lines.map(m => m.id === id ? { ...m, taxCode: code, taxRate: rate } : m));
    };

    const getLineGross = (mat: any) => (Number(mat.quantity) || 0) * (Number(mat.unitPrice) || 0);
    const getLineDiscAmt = (mat: any) => getLineGross(mat) * ((Number(mat.discountRate) || 0) / 100);
    const getLineNetPreTax = (mat: any) => getLineGross(mat) - getLineDiscAmt(mat);
    const getLineTaxAmt = (mat: any) => getLineNetPreTax(mat) * ((Number(mat.taxRate) || 0) / 100);
    const getLineTotal = (mat: any) => getLineNetPreTax(mat) + getLineTaxAmt(mat);

    const totalGrossPreTax = lines.reduce((sum, m) => sum + getLineNetPreTax(m), 0);
    const totalTax = lines.reduce((sum, m) => sum + getLineTaxAmt(m), 0);
    const subtotalWithTax = totalGrossPreTax + totalTax;
    const overallDiscountAmt = subtotalWithTax * ((Number(formData.overallDiscount) || 0) / 100);
    const shippingAmt = Number(formData.shippingAmount) || 0; // SARGENT FIX: Math inclusion
    const finalTotalAmount = subtotalWithTax - overallDiscountAmt + shippingAmt;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const validLines = lines.filter(m => m.description !== '');
        const payload = { ...formData, tenantId, lines: validLines };
        const res = isEditing ? await updatePurchaseOrder(tenantId, initialData.id, payload) : await createPurchaseOrder(payload);

        if (res.success) window.location.href = '/?module=purchase_orders&action=list';
        else setError(res.error);

        setLoading(false);
    };

    const STATUS_STEPS = ['PENDING_APPROVAL', 'FULFILLED', 'BILLED', 'PAID'];
    const currentStatus = initialData?.status || 'PENDING_APPROVAL';
    const currentIdx = STATUS_STEPS.indexOf(currentStatus);

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium pb-2 border-b border-slate-200 print:hidden">
                <Link href="/?module=purchase_orders&action=list" className="hover:text-sky-600 flex items-center transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Ledger
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-bold uppercase tracking-wider">{isEditing ? `PO-${initialData.transaction_number || initialData.id.split('-')[0].toUpperCase()}` : 'Draft Purchase Order'}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 w-full items-start animate-in fade-in slide-in-from-bottom-4">

                {/* LEFT PANE: Sticky Status Tracker */}
                <div className="w-full lg:w-72 flex-shrink-0 sticky top-6 print:hidden">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">P2P Workflow</h3>
                        <div className="space-y-6">
                            {STATUS_STEPS.map((step, idx) => {
                                const isCompleted = idx < currentIdx;
                                const isActive = idx === currentIdx;
                                return (
                                    <div key={step} className="flex items-start">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                    isActive ? 'bg-white border-sky-600 text-sky-600' : 'bg-slate-50 border-slate-200 text-slate-300'
                                                }`}>
                                                {isCompleted ? <CheckCircle2 size={12} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                            </div>
                                            {idx !== STATUS_STEPS.length - 1 && (
                                                <div className={`w-0.5 h-10 mt-2 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                                            )}
                                        </div>
                                        <div className="pt-1">
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
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
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-w-0 print:border-none print:shadow-none">
                    <div className="bg-sky-950 text-white p-6 flex justify-between items-center print:bg-white print:text-black print:border-b print:border-slate-800">
                        <div className="flex items-center space-x-3">
                            <ShoppingCart size={24} className="text-sky-400 print:text-slate-800" />
                            <div><h2 className="text-lg font-bold tracking-wider uppercase">{isEditing ? 'Modify Purchase Order' : 'Issue Purchase Order'}</h2></div>
                        </div>
                        {isEditing && (
                            <div className="text-right hidden print:block">
                                <p className="font-bold text-lg">PO-{initialData.transaction_number || initialData.id.split('-')[0].toUpperCase()}</p>
                                <p className="text-sm font-mono">{new Date().toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-lg text-sm font-bold border border-rose-200 print:hidden">{error}</div>}

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-white print:border-none print:p-0">
                            <div>
                                <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                    Select Vendor
                                    {formData.vendorId && (
                                        <Link href={`/?module=entity_directory&action=edit&id=${formData.vendorId}`} target="_blank" className="ml-2 text-sky-500 hover:text-sky-700 transition-colors print:hidden">
                                            <ExternalLink size={14} />
                                        </Link>
                                    )}
                                </label>
                                <CustomCombobox value={formData.vendorId} onChange={(val: string) => setFormData({ ...formData, vendorId: val })} options={vendorOptions} />
                            </div>
                        </div>

                        {/* Section: Horizontally & Vertically Scrollable Line Items */}
                        <div className="w-full border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden print:border-none print:shadow-none">
                            <div className="overflow-auto min-h-[350px] max-h-[500px] print:overflow-visible print:max-h-none">
                                <table className="w-full text-left text-sm min-w-[1500px] print:min-w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold sticky top-0 z-20 print:static print:bg-white print:border-slate-800">
                                        <tr>
                                            <th className="p-4">Item Catalog / SKU</th>
                                            <th className="p-4 w-64">Description</th>
                                            <th className="p-4 w-24">Qty</th>
                                            <th className="p-4 w-28">Rate (₹)</th>
                                            <th className="p-4 w-24">Disc (%)</th>
                                            <th className="p-4 w-28 text-right">Disc Amt</th>
                                            <th className="p-4 w-32">Tax Code</th>
                                            <th className="p-4 w-20 text-right">Tax (%)</th>
                                            <th className="p-4 w-28 text-right">Tax Amt</th>
                                            <th className="p-4 w-32 text-right">Amount</th>
                                            <th className="p-4 w-12 text-center print:hidden"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lines.map((line) => (
                                            <tr key={line.id} className="bg-white">
                                                <td className="p-4">
                                                    <CustomCombobox value={line.sku} onChange={(val: string) => handleItemSelect(line.id, val)} options={rmOptions} />
                                                </td>
                                                <td className="p-4"><input required type="text" value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-sky-500 outline-none h-10" /></td>
                                                <td className="p-4"><input required type="number" min="0.01" step="0.01" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm focus:border-sky-500 outline-none h-10" /></td>
                                                <td className="p-4"><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm focus:border-sky-500 outline-none h-10" /></td>
                                                <td className="p-4"><input type="number" min="0" max="100" step="0.01" value={line.discountRate} onChange={e => updateLine(line.id, 'discountRate', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono text-sm focus:border-sky-500 outline-none h-10" /></td>

                                                <td className="p-4 text-right font-mono text-rose-500 bg-slate-50/50 rounded-md font-medium print:bg-white">
                                                    ₹{getLineDiscAmt(line).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                <td className="p-4">
                                                    <select value={line.taxCode} onChange={e => handleTaxChange(line.id, e.target.value)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-sky-500 outline-none bg-white h-10 appearance-none">
                                                        <option value="EXEMPT">Exempt (0%)</option>
                                                        <option value="GST5">GST (5%)</option>
                                                        <option value="GST12">GST (12%)</option>
                                                        <option value="GST18">GST (18%)</option>
                                                        <option value="GST28">GST (28%)</option>
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-right font-mono text-sm text-slate-500 h-10 flex items-center justify-end print:bg-white print:border-none">
                                                        {line.taxRate}%
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-mono text-slate-500 bg-slate-50/50 rounded-md font-medium print:bg-white">
                                                    ₹{getLineTaxAmt(line).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                <td className="p-4 text-right font-mono font-bold text-slate-800">₹{getLineTotal(line).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-center print:hidden"><button type="button" onClick={() => removeLine(line.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-50"><Trash2 size={16} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-3 bg-white border-t border-slate-100 print:hidden">
                                <button type="button" onClick={() => setLines([...lines, { id: crypto.randomUUID(), sku: '', description: '', quantity: '', unitPrice: '', discountRate: '', taxCode: 'EXEMPT', taxRate: 0 }])} className="text-xs font-bold text-sky-600 uppercase flex items-center hover:text-sky-800 transition-colors"><Plus size={14} className="mr-1" /> Add Item</button>
                            </div>
                        </div>

                        {/* Section: Financial Totals */}
                        <div className="flex justify-end pt-4">
                            <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm print:bg-white print:border-none print:shadow-none print:p-0">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Gross (Pre-Tax)</span>
                                    <span className="text-slate-800 font-mono">₹{totalGrossPreTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Tax</span>
                                    <span className="text-slate-800 font-mono">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Overall Discount (%)</span>
                                    <input type="number" min="0" max="100" step="0.01" value={formData.overallDiscount} onChange={e => setFormData({ ...formData, overallDiscount: e.target.value })} className="w-20 border border-slate-300 rounded p-1.5 text-right font-mono text-xs focus:border-sky-500 outline-none print:border-none print:p-0" />
                                </div>

                                {/* SARGENT FIX: Shipping & Landed Costs Input */}
                                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-4">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Shipping & Landed Costs</span>
                                    <input type="number" min="0" step="0.01" value={formData.shippingAmount} onChange={e => setFormData({ ...formData, shippingAmount: e.target.value })} className="w-24 border border-slate-300 rounded p-1.5 text-right font-mono text-xs focus:border-sky-500 outline-none print:border-none print:p-0" />
                                </div>

                                <div className="flex justify-between items-center text-lg font-black pt-2">
                                    <span className="uppercase tracking-wider text-xs">Final Total</span>
                                    <span className="text-sky-600 font-mono">₹{finalTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-6 border-t border-slate-200 space-x-4 print:hidden">
                            {isEditing && (
                                <a href={`/?module=purchase_orders&action=print&id=${initialData.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-all">
                                    <Printer size={16} /> <span>Print Document</span>
                                </a>
                            )}
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>{isEditing ? 'Save Changes' : 'Submit PO'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}