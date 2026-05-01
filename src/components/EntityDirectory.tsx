"use client";

import React, { useState } from 'react';
import { Users, Plus, Save, Loader2, Building } from 'lucide-react';
import { createEntity } from '@/actions/entities';

export default function EntityDirectory({ entities, tenantId }: { entities: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', type: 'CUSTOMER' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const response = await createEntity({ ...formData, tenantId });
        if (response.success) {
            setShowForm(false);
            setFormData({ name: '', email: '', type: 'CUSTOMER' });
        } else {
            alert("Error: " + response.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Create Form Toggle */}
            {showForm && (
                <div className="bg-white border border-violet-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Register New Entity</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Relationship Type</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-violet-500 outline-none">
                                <option value="CUSTOMER">Customer (O2C)</option>
                                <option value="VENDOR">Vendor (P2P)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company / Individual Name</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-violet-500 outline-none" placeholder="E.g. Wayne Enterprises" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-violet-500 outline-none" placeholder="billing@company.com" />
                        </div>
                        <div className="md:col-span-4 flex justify-end space-x-3 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-md">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Save Entity</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Directory Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-violet-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-violet-100 rounded-lg text-violet-700"><Users size={20} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Entity Directory</h2>
                            <p className="text-xs text-slate-500 mt-1">Master list of all Customers and Vendors.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md">
                        <Plus size={16} /> <span>New Entity</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Entity Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Contact Email</th>
                                <th className="px-6 py-4 text-right">System ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {entities.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <Building size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No entities registered in the directory.</p>
                                    </td>
                                </tr>
                            ) : (
                                entities.map((ent: any) => (
                                    <tr key={ent.id} className="hover:bg-violet-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{ent.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${ent.type === 'CUSTOMER' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                                                {ent.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{ent.email || '—'}</td>
                                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                                            {ent.id.split('-')[0]}...
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