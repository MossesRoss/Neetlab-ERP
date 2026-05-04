"use client";

import React, { useState } from 'react';
import { Save, Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { createEntity, updateEntity } from '@/actions/entities';
import Link from 'next/link';

export default function EntityForm({ tenantId, initialData }: { tenantId: string, initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        type: initialData?.type || 'CUSTOMER',
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        website: initialData?.website || '',
        taxId: initialData?.tax_id || '',
        paymentTerms: initialData?.payment_terms || 'Net 30',
        billingAddress: initialData?.billing_address || '',
        shippingAddress: initialData?.shipping_address || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const response = isEditing 
            ? await updateEntity(tenantId, initialData.id, formData)
            : await createEntity(tenantId, formData);

        if (response.success) {
            window.location.href = '/?module=entity_directory&action=list';
        } else {
            setErrorMsg(response.error);
            setLoading(false);
        }
    };

    // Calculate Prefix for Display
    const prefix = formData.type === 'CUSTOMER' ? 'CUST' : 'VEND';
    const displayId = initialData?.entity_number ? `${prefix}-${initialData.entity_number}` : 'New Record';

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium pb-2 border-b border-slate-200">
                <Link href="/?module=entity_directory&action=list" className="hover:text-violet-600 flex items-center transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Directory
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-bold uppercase tracking-wider">
                    {isEditing ? displayId : 'Register Entity'}
                </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex-1">
                <div className="bg-violet-950 text-white p-6 flex items-center space-x-3">
                    <Building2 size={24} className="text-violet-400" />
                    <div>
                        <h2 className="text-lg font-bold tracking-wider uppercase">{isEditing ? 'Modify Entity Profile' : 'Register New Entity'}</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {errorMsg && <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-200">{errorMsg}</div>}
                    
                    {/* Identity Block */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Identity & Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Relationship Type</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none bg-white">
                                    <option value="CUSTOMER">Customer (O2C)</option>
                                    <option value="VENDOR">Vendor (P2P)</option>
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company / Individual Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none font-bold text-slate-800" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Website</label>
                                <input type="text" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Financials Block */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Compliance & Terms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tax ID / GSTIN</label>
                                <input type="text" value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm font-mono focus:border-violet-500 outline-none uppercase" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Terms</label>
                                <select value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none bg-white">
                                    <option value="Due on Receipt">Due on Receipt</option>
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 45">Net 45</option>
                                    <option value="Net 60">Net 60</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Locations Block */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Location & Logistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Address</label>
                                <textarea value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} rows={4} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none resize-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Shipping Address</label>
                                <textarea value={formData.shippingAddress} onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })} rows={4} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-violet-500 outline-none resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                            <span>{isEditing ? 'Save Changes' : 'Register Entity'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}