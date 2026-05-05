"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Landmark, Search, Loader2, Filter, FileText } from 'lucide-react';
import { getGeneralLedgerReport } from '@/actions/reports';

export default function GeneralLedgerReport({ tenantId, accounts }: { tenantId: string, accounts: any[] }) {
    // Default to the current month for performance
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [accountId, setAccountId] = useState('');

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        const res = await getGeneralLedgerReport(tenantId, { startDate, endDate, accountId });
        if (res.success) {
            setReportData(res.data);
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    // Group and Sort the Data Hierarchically (Like NetSuite)
    const accountsGrouped = useMemo(() => {
        const groups: Record<string, any[]> = {};

        reportData.forEach(line => {
            const accKey = `${line.accounts.account_number} - ${line.accounts.name}`;
            if (!groups[accKey]) groups[accKey] = [];
            groups[accKey].push(line);
        });

        // Sort lines within each group by date chronologically
        for (const key in groups) {
            groups[key].sort((a, b) => new Date(a.journal_entries.entry_date).getTime() - new Date(b.journal_entries.entry_date).getTime());
        }

        // Sort the groups themselves by Account Number
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {} as Record<string, any[]>);
    }, [reportData]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-indigo-950 p-6 rounded-xl shadow-sm gap-4 text-white">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-900/50 rounded-lg text-indigo-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">General Ledger</h1>
                    </div>
                </div>
            </div>

            {/* NetSuite Style Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Account</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 bg-white">
                            <option value="">All Accounts</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.account_number} - {acc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md h-10 min-w-[140px]"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />}
                    <span>Refresh</span>
                </button>
            </div>

            {/* Hierarchical Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-800 border-b border-slate-900 text-slate-200 uppercase text-[10px] tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Document Number</th>
                                <th className="px-6 py-3">Memo / Description</th>
                                <th className="px-6 py-3 text-right">Debit (₹)</th>
                                <th className="px-6 py-3 text-right">Credit (₹)</th>
                                <th className="px-6 py-3 text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying Immutable Ledger...</p>
                                    </td>
                                </tr>
                            ) : Object.keys(accountsGrouped).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                                        <Landmark size={32} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No ledger activity found for the selected period.</p>
                                    </td>
                                </tr>
                            ) : (
                                Object.entries(accountsGrouped).map(([accountName, lines]) => {
                                    let runningBalance = 0;
                                    let totalDebit = 0;
                                    let totalCredit = 0;
                                    const accountType = lines[0].accounts.type;

                                    return (
                                        <React.Fragment key={accountName}>
                                            {/* NetSuite-style Account Header */}
                                            <tr className="bg-slate-100/80 border-y border-slate-200">
                                                <td colSpan={6} className="px-6 py-2.5 font-black text-slate-800 text-xs tracking-wide">
                                                    {accountName}
                                                </td>
                                            </tr>

                                            {/* Transaction Details */}
                                            {lines.map((line: any) => {
                                                const debit = Number(line.debit) || 0;
                                                const credit = Number(line.credit) || 0;
                                                totalDebit += debit;
                                                totalCredit += credit;

                                                // True Accounting Balance Logic
                                                if (['ASSET', 'EXPENSE'].includes(accountType)) {
                                                    runningBalance += (debit - credit);
                                                } else {
                                                    runningBalance += (credit - debit);
                                                }

                                                // Generate Document Number Link
                                                const docNum = line.journal_entries.transactions
                                                    ? `${line.journal_entries.transactions.type.substring(0, 3)}-${line.journal_entries.transactions.transaction_number || '...'}`
                                                    : `JE-${line.journal_entries.id.split('-')[0].toUpperCase()}`;

                                                return (
                                                    <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-2.5 text-xs text-slate-600 pl-10 font-mono">{line.journal_entries.entry_date}</td>
                                                        <td className="px-6 py-2.5 text-xs font-mono font-bold text-indigo-600">{docNum}</td>
                                                        <td className="px-6 py-2.5 text-xs text-slate-700 truncate max-w-sm" title={line.journal_entries.memo}>{line.journal_entries.memo}</td>
                                                        <td className="px-6 py-2.5 text-xs font-mono text-right">{debit === 0 ? '' : debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-6 py-2.5 text-xs font-mono text-right">{credit === 0 ? '' : credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-6 py-2.5 text-xs font-mono text-right font-medium">{runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                );
                                            })}

                                            {/* NetSuite-style Account Footer */}
                                            <tr className="bg-slate-50 border-y border-slate-200">
                                                <td colSpan={3} className="px-6 py-3 font-bold text-slate-600 text-xs text-right uppercase tracking-wider">
                                                    Total - {accountName}
                                                </td>
                                                <td className="px-6 py-3 text-xs font-mono font-black text-slate-800 text-right border-t border-slate-300">
                                                    {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3 text-xs font-mono font-black text-slate-800 text-right border-t border-slate-300">
                                                    {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3 text-xs font-mono font-black text-indigo-700 text-right border-t border-slate-300 bg-slate-100">
                                                    {runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}