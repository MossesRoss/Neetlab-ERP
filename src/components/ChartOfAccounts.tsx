"use client";

import React, { useState } from 'react';
import { Landmark, Plus, Settings2, Save, X, Loader2 } from 'lucide-react';
import { createAccount, updateAccount } from '@/actions/gl';

export default function ChartOfAccounts({ accounts }: { accounts: any[] }) {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editAccount, setEditAccount] = useState<any | null>(null);

    const tenantId = '11111111-1111-1111-1111-111111111111';

    const [formData, setFormData] = useState({
        account_number: '',
        name: '',
        type: 'ASSET',
        is_active: true
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ASSET': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'LIABILITY': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'EQUITY': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'REVENUE': return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'EXPENSE': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const handleOpenCreate = () => {
        setEditAccount(null);
        setFormData({ account_number: '', name: '', type: 'ASSET', is_active: true });
        setShowForm(true);
    };

    const handleOpenEdit = (acc: any) => {
        setEditAccount(acc);
        setFormData({
            account_number: acc.account_number,
            name: acc.name,
            type: acc.type,
            is_active: acc.is_active
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData, tenantId };
        const res = editAccount
            ? await updateAccount(tenantId, editAccount.id, payload)
            : await createAccount(payload);

        if (res.success) {
            setShowForm(false);
            window.location.reload();
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* SARGENT FIX: Inline Form Panel */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                            {editAccount ? 'Modify Account Details' : 'Create New Account'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account #</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.account_number}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                    disabled={!!editAccount}
                                    placeholder="e.g. 1010"
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Operating Cash"
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    disabled={!!editAccount}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    <option value="ASSET">Asset</option>
                                    <option value="LIABILITY">Liability</option>
                                    <option value="EQUITY">Equity</option>
                                    <option value="REVENUE">Revenue</option>
                                    <option value="EXPENSE">Expense</option>
                                </select>
                            </div>
                        </div>

                        {editAccount && (
                            <div className="mb-6 flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
                                />
                                <span className="text-sm font-bold text-slate-700">Account is Active</span>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>Save Account</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-950 text-white">
                    <div className="flex items-center space-x-3">
                        <Landmark size={24} className="text-indigo-400" />
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider">Chart of Accounts</h2>
                        </div>
                    </div>
                    <button onClick={handleOpenCreate} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md">
                        <Plus size={16} /> <span>New Account</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4 w-32">Account #</th>
                                <th className="px-6 py-4">Account Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Landmark size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No Accounts configured for this tenant.</p>
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account: any) => (
                                    <tr key={account.id} className="hover:bg-indigo-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-900">
                                            {account.account_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{account.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 border rounded text-[10px] font-bold uppercase tracking-wider ${getTypeColor(account.type)}`}>
                                                {account.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {account.is_active ? (
                                                <span className="flex items-center justify-center space-x-1 text-emerald-600 text-[10px] font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span>Active</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center space-x-1 text-rose-500 text-[10px] font-bold uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                    <span>Inactive</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* SARGENT FIX: Settings button now strictly opens Restricted Edit Mode */}
                                            <button onClick={() => handleOpenEdit(account)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Edit Account">
                                                <Settings2 size={16} />
                                            </button>
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