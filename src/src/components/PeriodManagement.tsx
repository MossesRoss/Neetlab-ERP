"use client";

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Calendar, ShieldCheck, Loader2 } from 'lucide-react';
import { getPeriods, togglePeriodLock } from '@/actions/periods';

export default function PeriodManagement({ tenantId }: { tenantId: string }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadPeriods();
    }, [year]);

    const loadPeriods = async () => {
        setLoading(true);
        const res = await getPeriods(tenantId, year);
        if (res.success) setPeriods(res.data || []);
        setLoading(false);
    };

    const handleToggle = async (month: number, currentState: boolean) => {
        if (!confirm(`Are you sure you want to ${currentState ? 'UNLOCK' : 'LOCK'} Period ${month}/${year}?`)) return;

        setActionLoading(`${month}`);
        const res = await togglePeriodLock(tenantId, month, year, !currentState);
        if (res.success) {
            await loadPeriods();
        } else {
            alert("Error: " + res.error);
        }
        setActionLoading(null);
    };

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Financial Period Close</h1>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Immutable ledger locking mechanism</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-slate-400" />
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-md p-2 font-bold outline-none"
                    >
                        {[year - 1, year, year + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {months.map(month => {
                            const period = periods.find(p => p.period_month === month);
                            const isLocked = period?.is_locked || false;
                            const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

                            return (
                                <div key={month} className={`border rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${isLocked ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">{monthName}</h3>
                                    <p className="text-xs text-slate-500 font-mono mb-4">{month.toString().padStart(2, '0')} / {year}</p>

                                    {isLocked ? (
                                        <div className="text-rose-600 mb-4"><Lock size={32} /></div>
                                    ) : (
                                        <div className="text-emerald-500 mb-4"><Unlock size={32} /></div>
                                    )}

                                    <button
                                        onClick={() => handleToggle(month, isLocked)}
                                        disabled={actionLoading === `${month}`}
                                        className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${isLocked
                                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                            }`}
                                    >
                                        {actionLoading === `${month}` ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : isLocked ? (
                                            <span>Unlock</span>
                                        ) : (
                                            <span>Lock Period</span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}