import React from 'react';
import { Landmark, Plus, Settings2 } from 'lucide-react';

export default function ChartOfAccounts({ accounts }: { accounts: any[] }) {
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

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-950 text-white">
                <div className="flex items-center space-x-3">
                    <Landmark size={24} className="text-indigo-400" />
                    <div>
                        <h2 className="text-lg font-bold uppercase tracking-wider">Chart of Accounts</h2>
                        <p className="text-xs text-indigo-200/60 mt-1 font-mono">Immutable General Ledger Foundation</p>
                    </div>
                </div>
                <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md">
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
                                        <span className="flex items-center justify-center space-x-1 text-emerald-600 text-[10px] font-bold uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span>Active</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1">
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
    );
}