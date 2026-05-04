"use client";

import React from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserManagement({ users }: { users: any[] }) {
    const router = useRouter();

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Enterprise Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Users and Roles</h2>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/?module=user_management&action=create')}
                    className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md"
                >
                    <UserPlus size={16} /> <span>Create New</span>
                </button>
            </div>

            {/* Employee Directory Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Employee Name</th>
                            <th className="px-6 py-4">Contact Info</th>
                            <th className="px-6 py-4">System Role</th>
                            <th className="px-6 py-4 text-center">Sales Rep</th>
                            <th className="px-6 py-4 text-center">Access Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {users.map((user: any) => (
                            <tr
                                key={user.id}
                                onClick={() => router.push(`/?module=user_management&action=edit&id=${user.id}`)}
                                className="hover:bg-sky-50 transition-colors group cursor-pointer"
                            >
                                <td className="px-6 py-4 font-bold text-slate-900">{user.name || '—'}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-700">{user.email}</div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{user.mobile || 'No Mobile'}</div>
                                </td>
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
                                <td className="px-6 py-4 text-center">
                                    {user.is_sales_rep ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[10px] font-black uppercase tracking-widest">Yes</span>
                                    ) : (
                                        <span className="text-slate-300 text-lg leading-none">&middot;</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {user.has_access ? (
                                        <span className="flex items-center justify-center space-x-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span>Active</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center space-x-1 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                                            <span>Revoked</span>
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}