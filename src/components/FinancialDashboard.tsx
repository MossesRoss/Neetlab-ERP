"use client";

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function FinancialDashboard({ metrics }: { metrics: any }) {
    const safeMetrics = metrics || { operatingCash: 0, revenue: 0, expenses: 0, netIncome: 0 };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);

    const chartData = [
        { name: 'Revenue', value: safeMetrics.revenue, color: '#10b981' },
        { name: 'Expenses', value: safeMetrics.expenses, color: '#f43f5e' },
    ];

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
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
            </h3>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Executive Overview</h1>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Real-time General Ledger Aggregation</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Income (YTD)</p>
                    <p className={`text-4xl font-light font-mono ${safeMetrics.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safeMetrics.netIncome)}
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

            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Income Statement Visualization</h3>
                        <p className="text-xs text-slate-500 mt-1">Comparison of total revenue vs operating expenses.</p>
                    </div>
                    <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-widest">
                        <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded mr-2" /> Revenue</div>
                        <div className="flex items-center"><div className="w-3 h-3 bg-rose-500 rounded mr-2" /> Expenses</div>
                    </div>
                </div>
                
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}
                                formatter={(value: any) => [formatCurrency(value), 'Amount']}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}