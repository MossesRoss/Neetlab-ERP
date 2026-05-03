"use client";

import React, { useState } from 'react';
import { Shield, UserPlus, Loader2, CheckCircle, Mail, Key, X, Edit, UserX } from 'lucide-react';
import { provisionUser } from '@/actions/admin';
import { ROLES, ROLE_LABELS } from '@/lib/rbac';

export default function UserManagement({ users, tenantId }: { users: any[], tenantId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: ROLES.WAREHOUSE
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        const res = await provisionUser(tenantId, formData);

        if (res.success) {
            setSuccessMsg(`Successfully provisioned ${formData.email}.`);
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMsg('');
                setFormData({ email: '', password: '', role: ROLES.WAREHOUSE });
            }, 1500);
        } else {
            setErrorMsg(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Enterprise Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-xl shadow-sm gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Users and Roles Administration</h1>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md"
                >
                    <UserPlus size={16} /> <span>Create New</span>
                </button>
            </div>

            {/* Employee Directory */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">User Email</th>
                                <th className="px-6 py-4">System Role</th>
                                <th className="px-6 py-4">Provisioned On</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {users.map((user: any) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
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
                                    <td className="px-6 py-4 text-right">
                                        {/* SARGENT FIX: Inline Editing Actions */}
                                        <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-slate-400 hover:text-sky-600 transition-colors" title="Edit Role">
                                                <Edit size={16} />
                                            </button>
                                            <button className="text-slate-400 hover:text-rose-600 transition-colors" title="Deactivate User">
                                                <UserX size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SARGENT FIX: The Provisioning Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center space-x-2">
                                <UserPlus className="text-slate-500" size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">New Employee Provisioning</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {errorMsg && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded-lg">{errorMsg}</div>}
                            {successMsg && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-lg flex items-center"><CheckCircle size={16} className="mr-2" />{successMsg}</div>}

                            <div className="space-y-4">
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
                                            /* SARGENT FIX: Stripping the brackets here dynamically */
                                            <option key={key} value={key}>{label.split(' (')[0]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-slate-100 space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest">Cancel</button>
                                <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span>Confirm Provision</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}