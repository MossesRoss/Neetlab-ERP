import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinancialDashboard({ metrics }: { metrics: any }) {
    const safeMetrics = metrics || { operatingCash: 0, revenue: 0, expenses: 0, netIncome: 0 };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const StatCard = ({ title, value, icon: Icon, trend, type }: any) => (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${type === 'neutral' ? 'bg-slate-100 text-slate-600' :
                        type === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                            type === 'negative' ? 'bg-rose-100 text-rose-600' :
                                'bg-sky-100 text-sky-600'
                    }`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        Live
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className={`text-3xl font-light tracking-tight mt-1 ${value < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatCurrency(value)}
            </h3>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-wider">Executive Overview</h1>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Real-time General Ledger Aggregation</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Income (YTD)</p>
                    <p className={`text-4xl font-light font-mono ${safeMetrics.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(safeMetrics.netIncome)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Operating Cash"
                    value={safeMetrics.operatingCash}
                    icon={Wallet}
                    type="neutral"
                />
                <StatCard
                    title="Recognized Revenue"
                    value={safeMetrics.revenue}
                    icon={TrendingUp}
                    trend="up"
                    type="positive"
                />
                <StatCard
                    title="Total Expenses"
                    value={safeMetrics.expenses}
                    icon={TrendingDown}
                    trend="down"
                    type="negative"
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center h-64 text-slate-400">
                <DollarSign size={48} className="mb-4 text-slate-200" />
                <p className="text-sm font-medium">Income Statement Visualization</p>
                <p className="text-xs text-slate-400 mt-1">Chart components will be injected here in Phase 7.</p>
            </div>
        </div>
    );
}