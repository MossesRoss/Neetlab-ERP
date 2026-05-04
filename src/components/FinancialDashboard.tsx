"use client";

import React, { useState, useEffect } from 'react';
import { Settings2, Wallet, PieChart as PieChartIcon, Box, Wrench, Truck, FileCheck, Loader2, Save, X, Check } from 'lucide-react';
import { getDashboardData, saveDashboardLayout } from '@/actions/dashboard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WIDGET_REGISTRY: Record<string, any> = {
    'operating_cash': { title: 'Net Cash Flow (6 Mo Trend)', icon: Wallet, type: 'currency', color: 'emerald', size: 'col-span-1 md:col-span-2 lg:col-span-2', chartType: 'line', roles: ['ADMIN', 'ACCOUNTANT'] },
    'gross_margin': { title: 'Revenue vs COGS', icon: PieChartIcon, type: 'percentage', color: 'sky', size: 'col-span-1 md:col-span-1 lg:col-span-1', chartType: 'pie', roles: ['ADMIN', 'ACCOUNTANT'] },
    'inventory_value': { title: 'Procurement Volume (6 Mo)', icon: Box, type: 'currency', color: 'indigo', size: 'col-span-1 md:col-span-1 lg:col-span-1', chartType: 'bar', roles: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE', 'PROCUREMENT'] },
    'sales_backlog': { title: 'Sales Volume (6 Mo Trend)', icon: FileCheck, type: 'currency', color: 'emerald', size: 'col-span-1 md:col-span-2 lg:col-span-2', chartType: 'area', roles: ['ADMIN', 'ACCOUNTANT', 'SALES'] },
    'active_jobs': { title: 'Active Job Cards (WIP)', icon: Wrench, type: 'number', color: 'amber', size: 'col-span-1', chartType: 'stat', roles: ['ADMIN', 'WAREHOUSE', 'ACCOUNTANT'] },
    'open_subcontracts': { title: 'Pending Subcontracts', icon: Truck, type: 'number', color: 'violet', size: 'col-span-1', chartType: 'stat', roles: ['ADMIN', 'WAREHOUSE', 'PROCUREMENT', 'ACCOUNTANT'] },
};

const COLORS = {
    emerald: '#10b981', sky: '#0ea5e9', indigo: '#6366f1',
    amber: '#f59e0b', violet: '#8b5cf6', rose: '#f43f5e', slate: '#64748b'
};

export default function FinancialDashboard({ tenantId, userRole = 'VIEWER' }: { tenantId?: string, userRole?: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [metrics, setMetrics] = useState<any>({});
    const [layout, setLayout] = useState<string[]>([]);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [tempLayout, setTempLayout] = useState<string[]>([]);

    const activeTenant = tenantId || '11111111-1111-1111-1111-111111111111';

    useEffect(() => {
        fetchData();
    }, [userRole]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getDashboardData(activeTenant);
        if (res.success) {
            setMetrics(res.metrics);
            const allowedWidgets = Object.keys(WIDGET_REGISTRY).filter(key => WIDGET_REGISTRY[key].roles.includes(userRole));
            const savedLayout = res.layout.length > 0 ? res.layout : allowedWidgets;
            const secureLayout = savedLayout.filter((key: string) => allowedWidgets.includes(key));
            setLayout(secureLayout);
        }
        setLoading(false);
    };

    const handleSaveLayout = async () => {
        setSaving(true);
        const res = await saveDashboardLayout(tempLayout);
        if (res.success) {
            setLayout(tempLayout);
            setIsCustomizing(false);
        } else alert("Failed to save layout preferences.");
        setSaving(false);
    };

    const formatValue = (val: number, type: string) => {
        if (type === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
        if (type === 'percentage') return `${(val || 0).toFixed(2)}%`;
        return new Intl.NumberFormat('en-US').format(val);
    };

    const getTrendData = (key: string) => {
        const trends = metrics.trends || [];
        return trends.map((t: any) => ({
            name: t.month_name,
            value: key === 'operating_cash' ? Number(t.net_cash_flow) :
                key === 'sales_backlog' ? Number(t.sales_volume) :
                    key === 'inventory_value' ? Number(t.purchase_volume) : 0
        }));
    };

    const renderWidgetContent = (key: string, config: any, val: number) => {
        if (config.chartType === 'line') {
            const data = getTrendData(key);
            return (
                <div className="h-48 mt-4 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                            <Tooltip formatter={(value: number) => formatValue(value, 'currency')} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            {/* SARGENT FIX: isAnimationActive={false} prevents the visual glitching on hover */}
                            <Line isAnimationActive={false} type="monotone" dataKey="value" stroke={COLORS[config.color as keyof typeof COLORS]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (config.chartType === 'area' || config.chartType === 'bar') {
            const data = getTrendData(key);
            return (
                <div className="h-48 mt-4 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                            <Tooltip formatter={(value: number) => formatValue(value, 'currency')} cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            {/* SARGENT FIX: Disable animation */}
                            <Bar isAnimationActive={false} dataKey="value" fill={COLORS[config.color as keyof typeof COLORS]} radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (config.chartType === 'pie') {
            const revenue = metrics.revenue || 0;
            const cogs = revenue - (revenue * (val / 100));
            const data = [
                { name: 'Gross Profit', value: revenue - cogs, color: COLORS.emerald },
                { name: 'COGS', value: cogs, color: COLORS.rose }
            ];
            return (
                <div className="h-48 mt-4 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie isAnimationActive={false} data={data} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* SARGENT FIX: Adjusted typography and spacing to fix text overlap in donut chart */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-1">
                        <span className={`text-lg font-black leading-none ${val < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatValue(val, 'percentage')}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Margin</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-4 flex items-end h-full pb-4">
                <h3 className={`text-5xl font-light tracking-tight ${val < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {formatValue(val, config.type)}
                </h3>
            </div>
        );
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

    return (
        <div className="space-y-6">
            {/* SARGENT FIX: Clean Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-xl shadow-sm gap-4">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">Dashboard</h1>
                </div>
                <button onClick={() => { setTempLayout([...layout]); setIsCustomizing(true); }} className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                    <Settings2 size={16} /> <span>Customize View</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {layout.length === 0 ? (
                    <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
                        <Settings2 size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="font-bold uppercase tracking-wider text-sm mb-1">Dashboard is Empty</p>
                        <p className="text-xs">Click "Customize View" to add widgets.</p>
                    </div>
                ) : (
                    layout.map(key => {
                        const config = WIDGET_REGISTRY[key];
                        if (!config) return null;
                        const Icon = config.icon;
                        const val = metrics[key] || 0;

                        return (
                            <div key={key} className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col ${config.size}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-2 rounded-md bg-${config.color}-50 text-${config.color}-600`}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{config.title}</p>
                                    </div>
                                    {config.chartType !== 'stat' && (
                                        <span className={`text-lg font-bold font-mono ${val < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                            {formatValue(val, config.type)}
                                        </span>
                                    )}
                                </div>
                                {renderWidgetContent(key, config, val)}
                            </div>
                        );
                    })
                )}
            </div>

            {isCustomizing && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center space-x-2">
                                <Settings2 className="text-slate-500" size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Configure Dashboard Layout</h3>
                            </div>
                            <button onClick={() => setIsCustomizing(false)} className="text-slate-400 hover:text-slate-800"><X size={20} /></button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            {Object.entries(WIDGET_REGISTRY).map(([key, config]) => {
                                if (!config.roles.includes(userRole)) return null;

                                const isSelected = tempLayout.includes(key);
                                return (
                                    <div
                                        key={key}
                                        onClick={() => isSelected ? setTempLayout(tempLayout.filter(k => k !== key)) : setTempLayout([...tempLayout, key])}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <config.icon size={18} className={isSelected ? 'text-sky-600' : 'text-slate-400'} />
                                            <span className={`text-sm font-bold tracking-wide ${isSelected ? 'text-sky-900' : 'text-slate-600'}`}>{config.title}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-slate-300'}`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                            <button onClick={() => setIsCustomizing(false)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest">Cancel</button>
                            <button onClick={handleSaveLayout} disabled={saving} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Save Layout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}