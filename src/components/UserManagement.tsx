"use client";

import React, { useState } from 'react';
import { Shield, UserPlus, Loader2, CheckCircle, Mail, Key } from 'lucide-react';
import { provisionUser } from '@/actions/admin';
// Import roles directly from the engine to ensure 100% sync
import { ROLES, ROLE_LABELS } from '@/lib/rbac';

export default function UserManagement({ users, tenantId }: { users: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: ROLES.WAREHOUSE // Default to a safe, restricted role
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        const res = await provisionUser(tenantId, formData);

        if (res.success) {
            setSuccessMsg(`Successfully provisioned ${formData.email} with ${formData.role} access.`);
            setFormData({ email: '', password: '', role: ROLES.WAREHOUSE });
        } else {
            setErrorMsg(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex items-center space-x-3">
                <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                    <Shield size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-wider">Enterprise Administration</h1>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Tenant IAM & Role Provisioning</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-3">
                    <UserPlus size={18} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">New Employee Provisioning</h3>
                </div>

                {errorMsg && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-lg">{errorMsg}</div>}
                {successMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-lg flex items-center"><CheckCircle size={16} className="mr-2" />{successMsg}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-md py-2.5 pl-10 pr-3 text-sm focus:border-sky-500 outline-none" placeholder="employee@tanktechasia.com" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Temporary Password</label>
                        <div className="relative">
                            <Key size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input required type="text" minLength={8} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border border-slate-300 rounded-md py-2.5 pl-10 pr-3 text-sm focus:border-sky-500 outline-none" placeholder="Min 8 characters" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Role Clearance</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full border border-slate-300 rounded-md py-2.5 px-3 text-sm font-medium focus:border-sky-500 outline-none bg-slate-50">
                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3 flex justify-end pt-4 border-t border-slate-100">
                        <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            <span>Provision User</span>
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Employee Directory</h3>
                    <p className="text-xs text-slate-500 mt-1">Authorized access list for this tenant.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">User Email</th>
                                <th className="px-6 py-4">System Role</th>
                                <th className="px-6 py-4">Provisioned On</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {users.map((user: any) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest
                                            ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                                user.role === 'ACCOUNTANT' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'WAREHOUSE' ? 'bg-amber-100 text-amber-700' :
                                                        user.role === 'PROCUREMENT' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-emerald-100 text-emerald-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="flex items-center justify-center space-x-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span>Active</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}