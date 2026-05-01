"use client";

import React, { useState } from 'react';
import { Users, UserPlus, Shield, Save, Loader2, Mail, Lock } from 'lucide-react';
import { createUser } from '@/actions/admin';

export default function UserManagement({ users, tenantId }: { users: any[], tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', role: 'SALES' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await createUser(tenantId, formData);
        if (res.success) {
            setShowForm(false);
            setFormData({ email: '', password: '', role: 'SALES' });
        } else {
            alert("Error creating user: " + res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-800 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-700 rounded-lg text-slate-300">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Enterprise Administration</h1>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Tenant IAM & Role Provisioning</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center space-x-2 bg-slate-100 hover:bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md"
                >
                    <UserPlus size={16} /> <span>Provision User</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 border-b pb-2 flex items-center">
                        <UserPlus size={18} className="mr-2 text-slate-400" /> New Employee Provisioning
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    required 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                    className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 text-sm focus:border-slate-500 outline-none transition-all" 
                                    placeholder="employee@core.com" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Temporary Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    required 
                                    type="password" 
                                    value={formData.password} 
                                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                                    className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 text-sm focus:border-slate-500 outline-none transition-all" 
                                    placeholder="••••••••" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assigned Role</label>
                            <select 
                                value={formData.role} 
                                onChange={e => setFormData({ ...formData, role: e.target.value })} 
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-slate-500 outline-none bg-white transition-all"
                            >
                                <option value="ADMIN">ADMIN (Full Access)</option>
                                <option value="SALES">SALES (O2C Only)</option>
                                <option value="PROCUREMENT">PROCUREMENT (P2P Only)</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest">Cancel</button>
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Provision Access</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Employee Directory</h2>
                            <p className="text-xs text-slate-500 mt-1">Authorized access list for this tenant.</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-black">
                            <tr>
                                <th className="px-6 py-4">User Email</th>
                                <th className="px-6 py-4">System Role</th>
                                <th className="px-6 py-4">Provisioned On</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {users.map((user: any) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                                            user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                            user.role === 'SALES' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            'bg-sky-100 text-sky-700 border-sky-200'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-1.5">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                                        </div>
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
