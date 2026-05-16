'use client';

import { useEffect, useState } from 'react';
import { Mail, Search, Clock, User, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '@/services/adminApi';

interface ContactMessage {
    id: string;
    studentName: string;
    studentEmail: string;
    message: string;
    submittedAt: string;
}

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadMessages = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        
        try {
            const data = await adminApi.getContactMessages();
            setMessages(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const filtered = messages.filter(m => 
        m.studentName.toLowerCase().includes(search.toLowerCase()) ||
        m.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="admin-page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="admin-page-header__title">Contact Messages</h1>
                        <p className="admin-page-header__subtitle">Review inquiries from the public and students</p>
                    </div>
                    <button 
                        onClick={() => loadMessages(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm ${refreshing ? 'opacity-50' : ''}`}
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="admin-card__toolbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="admin-search flex-1 max-w-md">
                    <Search size={18} className="admin-search__icon" />
                    <input 
                        type="text" 
                        className="admin-search__input"
                        placeholder="Search name, email or message..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 font-medium">Loading messages...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Mail size={32} className="text-slate-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No messages found</h3>
                    <p className="text-slate-400 text-sm">When users contact you, their messages will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((m, idx) => {
                        // Handle potential object IDs from MongoDB serialization
                        const uniqueKey = typeof m.id === 'object' 
                            ? `${m.studentEmail}-${m.submittedAt}-${idx}`
                            : (m.id || `${m.studentEmail}-${idx}`);
                        
                        return (
                            <div key={uniqueKey} className="admin-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 leading-none mb-1">{m.studentName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                            <span className="text-blue-500 lowercase">{m.studentEmail}</span>
                                            <span className="text-slate-200">•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDate(m.submittedAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 relative group">
                                <MessageSquare size={16} className="absolute top-4 left-4 text-slate-200 group-hover:text-blue-200 transition-colors" />
                                <div className="pl-7">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                        {m.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
