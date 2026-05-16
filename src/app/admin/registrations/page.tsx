'use client';

import { useEffect, useState, useCallback } from 'react';
import { schedulingApi } from '@/services/schedulingApi';
import RegistrationTable from '@/components/admin/RegistrationTable';
import { ClipboardList, RefreshCw } from 'lucide-react';

export default function AdminRegistrationsPage() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        schedulingApi.getRegistrations()
            .then(setRegistrations)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="p-6">
            <div className="admin-page-header flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                            <ClipboardList size={20} />
                        </div>
                        <h1 className="admin-page-header__title">Student Registrations</h1>
                    </div>
                    <p className="admin-page-header__subtitle">
                        Review and approve student-selected schedules and blocks.
                    </p>
                </div>
                
                <button 
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                    disabled={loading}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3">
                    <span className="text-xl text-rose-400">❌</span>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="admin-card">
                    <div className="admin-card__toolbar">
                        <div className="admin-skeleton" style={{ height: 36, width: 240 }} />
                    </div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="admin-skeleton" style={{ height: 64, margin: '4px 12px', borderRadius: 12 }} />
                    ))}
                </div>
            ) : (
                <RegistrationTable 
                    registrations={registrations} 
                    onRefresh={load} 
                />
            )}
        </div>
    );
}
