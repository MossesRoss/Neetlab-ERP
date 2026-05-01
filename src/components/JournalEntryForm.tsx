"use client";

import React, { useState } from 'react';
import { createJournalEntry } from '@/actions/gl';
import { Plus, Trash2, Save, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function JournalEntryForm({ accounts }: { accounts: any[] }) {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [memo, setMemo] = useState('');

    const tenantId = '11111111-1111-1111-1111-111111111111';

    const [lines, setLines] = useState([
        { id: '1', accountId: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', debit: 0, credit: 0 }
    ]);

    const addLine = () => setLines([...lines, { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 }]);

    const updateLine = (id: string, field: string, value: string | number) => {
        setLines(lines.map(line => {
            if (line.id !== id) return line;
            const updatedLine = { ...line, [field]: value };
            // Prevent entering both debit and credit on the same line
            if (field === 'debit' && Number(value) > 0) updatedLine.credit = 0;
            if (field === 'credit' && Number(value) > 0) updatedLine.debit = 0;
            return updatedLine;
        }));
    };

    const removeLine = (id: string) => { if (lines.length > 2) setLines(lines.filter(line => line.id !== id)); };

    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setSuccessMsg(''); setErrorMsg('');

        if (!isBalanced) {
            setErrorMsg("Journal entry must be balanced.");
            setLoading(false); return;
        }

        const validLines = lines.filter(l => l.accountId !== '');
        const payload = { tenantId, memo, lines: validLines };
        const response = await createJournalEntry(payload);

        if (response.success) {
            setSuccessMsg(`Journal Entry Posted! ID: ${response.journalEntryId}`);
            setMemo('');
            setLines([{ id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 }, { id: crypto.randomUUID(), accountId: '', debit: 0, credit: 0 }]);
        } else {
            setErrorMsg(response.error || "Failed to post Journal Entry");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-950 text-white p-6 flex items-center space-x-3">
                <FileText size={24} className="text-indigo-400" />
                <div>
                    <h2 className="text-lg font-bold tracking-wider uppercase">Post Journal Entry</h2>
                    <p className="text-xs text-indigo-200/60 font-mono mt-1">Manual GL Adjustment</p>
                </div>
            </div>

            <div className="p-8">
                {successMsg && <div className="mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-md text-sm font-medium">{successMsg}</div>}
                {errorMsg && <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-md text-sm font-medium">{errorMsg}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Entry Memo</label>
                        <input required type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Reason for adjustment (e.g., Monthly Depreciation)" className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm" />
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="p-4">Account</th>
                                    <th className="p-4 w-32 text-right">Debit ($)</th>
                                    <th className="p-4 w-32 text-right">Credit ($)</th>
                                    <th className="p-4 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line) => (
                                    <tr key={line.id} className="bg-white">
                                        <td className="p-4">
                                            <select required value={line.accountId} onChange={(e) => updateLine(line.id, 'accountId', e.target.value)} className="w-full border border-slate-300 rounded-md p-2 focus:outline-none focus:border-indigo-500 text-sm">
                                                <option value="">Select Account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.account_number} - {acc.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4"><input type="number" step="0.01" min="0" value={line.debit || ''} onChange={(e) => updateLine(line.id, 'debit', e.target.value)} disabled={Number(line.credit) > 0} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 text-sm" /></td>
                                        <td className="p-4"><input type="number" step="0.01" min="0" value={line.credit || ''} onChange={(e) => updateLine(line.id, 'credit', e.target.value)} disabled={Number(line.debit) > 0} className="w-full border border-slate-300 rounded-md p-2 text-right font-mono focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 text-sm" /></td>
                                        <td className="p-4 text-center"><button type="button" onClick={() => removeLine(line.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                            <button type="button" onClick={addLine} className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"><Plus size={14} className="mr-1" /> Add Line</button>
                        </div>
                    </div>

                    <div className={`flex flex-col sm:flex-row justify-between items-center border rounded-xl p-6 ${isBalanced ? 'bg-indigo-50 border-indigo-200' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center space-x-3 text-sm max-w-sm">
                            {!isBalanced ? (
                                <><AlertCircle className="text-rose-500" size={24} /><p className="text-rose-700"><strong>Out of Balance:</strong> Debits and Credits must be equal to post.</p></>
                            ) : (
                                <p className="text-indigo-700 font-medium">Entry is balanced and ready to post.</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                                <p className={`text-2xl font-light font-mono ${isBalanced ? 'text-indigo-900' : 'text-rose-600'}`}>
                                    ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <button type="submit" disabled={loading || !isBalanced} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>{loading ? 'Posting...' : 'Post Entry'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}