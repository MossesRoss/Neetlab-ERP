import React from 'react';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';

export default function JournalEntryList({ entries }: { entries: any[] }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Journal Entries</h2>
                </div>
                <Link
                    href="/?module=journal_entries&action=create"
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md"
                >
                    <Plus size={16} /> <span>New Entry</span>
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Entry ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Memo</th>
                            <th className="px-6 py-4 text-right">Volume (Debit)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>No Journal Entries posted for this tenant.</p>
                                </td>
                            </tr>
                        ) : (
                            entries.map((je: any) => (
                                <tr key={je.id} className="hover:bg-indigo-50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 font-mono text-xs text-indigo-700 font-medium">
                                        JE-{je.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{je.entry_date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{je.memo}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                        ${Number(je.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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