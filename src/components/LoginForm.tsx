"use client";

import React, { useState } from 'react';
import { Building2, Key, Loader2, ShieldCheck } from 'lucide-react';
import { authenticate } from '@/actions/auth';

export default function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const res = await authenticate(formData);

        if (!res.success) {
            setError(res.error || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-sky-500/10 p-3 rounded-full border border-sky-500/20">
                            <Building2 className="text-sky-400" size={40} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Core ERP</h1>
                    <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-widest">Enterprise Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Corporate Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            defaultValue="admin@core.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                            placeholder="admin@core.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Secure Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            defaultValue="admin123"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2">
                            <ShieldCheck className="text-red-400 shrink-0" size={16} />
                            <p className="text-red-400 text-xs font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center space-x-2 shadow-lg shadow-sky-900/50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                        <span>{loading ? 'Authenticating...' : 'Secure Login'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}