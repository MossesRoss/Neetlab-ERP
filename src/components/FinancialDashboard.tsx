"use client";

import React, { useState, useEffect } from 'react';
import { Settings2, Wallet, PieChart, Box, Wrench, Truck, FileCheck, Loader2, Save, X } from 'lucide-react';
import { getDashboardData, saveDashboardLayout } from '@/actions/dashboard';

const WIDGET_REGISTRY = {
    'operating_cash': { title: 'Operating Cash Flow', icon: Wallet, type: 'currency', color: 'emerald' },
    'gross_margin': { title: 'Gross Profit Margin', icon: PieChart, type: 'percentage', color: 'sky' },
    'inventory_value': { title: 'Total Inventory Value', icon: Box, type: 'currency', color: 'indigo' },
    'active_jobs': { title: 'Active Job Cards (WIP)', icon: Wrench, type: 'number', color: 'amber' },
    'open_subcontracts': { title: 'Pending Subcontracts', icon: Truck, type: 'number', color: 'violet' },
    'sales_backlog': { title: 'Sales Order Backlog', icon: FileCheck, type: 'currency', color: 'emerald' },
};

export default function FinancialDashboard({ tenantId }: { tenantId?: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [metrics, setMetrics] = useState<any>({});
    const [layout, setLayout] = useState<string[]>([]);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [tempLayout, setTempLayout] = useState<string[]>([]);

    // Fallback for local dev if prop isn't passed from page.tsx immediately
    const activeTenant = tenantId || '11111111-1111-1111-1111-111111111111';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const res = await getDashboardData(activeTenant);
        if (res.success) {
            setMetrics(res.metrics);
            setLayout(res.layout);
        }
        setLoading(false);
    };

    const openCustomizer = () => {
        setTempLayout([...layout]);
        setIsCustomizing(true);
    };

    const toggleWidget = (key: string) => {
        if (tempLayout.includes(key)) {
            setTempLayout(tempLayout.filter(k => k !== key));
        } else {
            setTempLayout([...tempLayout, key]);
        }
    };

    const handleSaveLayout = async () => {
        setSaving(true);
        const res = await saveDashboardLayout(tempLayout);
        if (res.success) {
            setLayout(tempLayout);
            setIsCustomizing(false);
        } else {
            alert("Failed to save layout preferences.");
        }
        setSaving(false);
    };

    const formatValue = (val: number, type: string) => {
        if (type === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        if (type === 'percentage') return `${val.toFixed(2)}%`;
        return new Intl.NumberFormat('en-US').format(val);
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white p-6 rounded-xl shadow-lg gap-4">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-wider">Manufacturing Dashboard</h1>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Real-time KPI Engine (Tenant Isolated)</p>
                </div>
                <button
                    onClick={openCustomizer}
                    className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md border border-slate-700"
                >
                    <Settings2 size={16} /> <span>Customize View</span>
                </button>
            </div>

            {/* Dynamic Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {layout.length === 0 ? (
                    <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
                        <Settings2 size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="font-bold uppercase tracking-wider text-sm mb-1">Dashboard is Empty</p>
                        <p className="text-xs">Click "Customize View" to add widgets.</p>
                    </div>
                ) : (
                    layout.map(key => {
                        const config = WIDGET_REGISTRY[key as keyof typeof WIDGET_REGISTRY];
                        if (!config) return null;
                        const Icon = config.icon;
                        const val = metrics[key] || 0;

                        return (
                            <div key={key} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg bg-${config.color}-50 text-${config.color}-600`}>
                                        <Icon size={20} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{config.title}</p>
                                <h3 className={`text-3xl font-light tracking-tight ${val < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {formatValue(val, config.type)}
                                </h3>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Customization Modal */}
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
                                const isSelected = tempLayout.includes(key);
                                return (
                                    <div
                                        key={key}
                                        onClick={() => toggleWidget(key)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <config.icon size={18} className={isSelected ? 'text-sky-600' : 'text-slate-400'} />
                                            <span className={`text-sm font-bold tracking-wide ${isSelected ? 'text-sky-900' : 'text-slate-600'}`}>
                                                {config.title}
                                            </span>
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
                            <button
                                onClick={handleSaveLayout}
                                disabled={saving}
                                className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} <span>Save Layout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}