"use client";

import React, { useState } from 'react';
import { Shield, Save, Loader2, ArrowLeft, UserCheck } from 'lucide-react';
import { provisionUser, updateUser } from '@/actions/admin';
import { ROLES, ROLE_LABELS } from '@/lib/rbac';
import Link from 'next/link';

export default function UserForm({ tenantId, initialData }: { tenantId: string, initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        mobile: initialData?.mobile || '',
        department: initialData?.department || '',
        jobTitle: initialData?.job_title || '',
        password: '',
        role: initialData?.role || ROLES.WAREHOUSE,
        hasAccess: initialData?.has_access ?? true,
        isSalesRep: initialData?.is_sales_rep ?? false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const response = isEditing
            ? await updateUser(tenantId, initialData.id, formData)
            : await provisionUser(tenantId, formData);

        if (response.success) {
            window.location.href = '/?module=user_management&action=list';
        } else {
            setErrorMsg(response.error);
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500 font-medium pb-2 border-b border-slate-200">
                <Link href="/?module=user_management&action=list" className="hover:text-sky-600 flex items-center transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Directory
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-bold uppercase tracking-wider">{isEditing ? `Edit ${initialData.name || initialData.email}` : 'New Employee'}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex-1">
                <div className="bg-slate-900 text-white p-6 flex items-center space-x-3">
                    <UserCheck size={24} className="text-sky-400" />
                    <div>
                        <h2 className="text-lg font-bold tracking-wider uppercase">{isEditing ? 'Modify Employee Profile' : 'Provision New Employee'}</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {errorMsg && <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-200">{errorMsg}</div>}

                    {/* Identity Block */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Identity & Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-sky-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Corporate Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-sky-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number</label>
                                <input type="text" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-sky-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Job Title</label>
                                <input type="text" value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-sky-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-sky-500 outline-none bg-white">
                                    <option value=""></option>
                                    <option value="Management">Management</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Production">Production</option>
                                    <option value="Warehouse">Warehouse</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Procurement">Procurement</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Access & Role Block */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">System Access & Routing</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.hasAccess}
                                    onChange={e => setFormData({ ...formData, hasAccess: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="block text-sm font-bold text-slate-800">Give System Access</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isSalesRep}
                                    onChange={e => setFormData({ ...formData, isSalesRep: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="block text-sm font-bold text-slate-800">Is Sales Rep</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Role Clearance</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    disabled={!formData.hasAccess}
                                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm font-medium focus:border-sky-500 outline-none bg-white disabled:opacity-50 disabled:bg-slate-50"
                                >
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label.split(' (')[0]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {isEditing ? 'Reset Password' : 'Temporary Password'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    disabled={!formData.hasAccess}
                                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:border-sky-500 outline-none disabled:opacity-50 disabled:bg-slate-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>{isEditing ? 'Save Changes' : 'Provision Employee'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}