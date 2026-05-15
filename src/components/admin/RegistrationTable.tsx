'use client';

import { useState } from 'react';
import { 
    CheckCircle2, XCircle, Clock, Eye, Sparkles, UserCheck, 
    AlertCircle, Search, Filter, ArrowUpDown, ChevronDown,
    Calendar, User, Mail, BookOpen, Clock3, Database
} from 'lucide-react';
import { schedulingApi } from '@/services/schedulingApi';

interface Registration {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    selectedBlock: any;
    status: 'Pending' | 'Approved' | 'Rejected';
    registeredAt: string;
    isFromRecommendation: boolean;
    isFromRl: boolean;
    isModified: boolean;
    adminNote?: string;
    processedAt?: string;
}

export default function RegistrationTable({ 
    registrations, 
    onRefresh 
}: { 
    registrations: Registration[],
    onRefresh: () => void 
}) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const filtered = registrations.filter(r => {
        const matchesSearch = 
            (r.studentName || (r as any).StudentName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.studentEmail || (r as any).StudentEmail || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.selectedBlock?.blockId || r.selectedBlock?.block_id || '').toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleAction = async (status: 'Approved' | 'Rejected') => {
        if (!selectedReg) return;
        setProcessing(true);
        try {
            await schedulingApi.approveRegistration(selectedReg.id, status, adminNote);
            setIsActionModalOpen(false);
            setSelectedReg(null);
            setAdminNote('');
            onRefresh();
        } catch (e) {
            console.error(e);
            alert('Action failed');
        } finally {
            setProcessing(false);
        }
    };

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
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="admin-card__toolbar bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="admin-search flex-1 max-w-md">
                    <Search size={18} className="admin-search__icon" />
                    <input 
                        type="text" 
                        className="admin-search__input"
                        placeholder="Search student or block ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                    {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                        <button
                            key={f}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === f ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            onClick={() => setStatusFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container */}
            <div className="admin-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="admin-table__th">Student</th>
                                <th className="admin-table__th">Schedule Block</th>
                                <th className="admin-table__th">Method</th>
                                <th className="admin-table__th">Status</th>
                                <th className="admin-table__th">Date</th>
                                <th className="admin-table__th text-center" style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((r, idx) => {
                                const rowKey = r.id || (r as any)._id || idx;
                                const keyString = typeof rowKey === 'object' ? JSON.stringify(rowKey) : String(rowKey);
                                
                                return (
                                    <tr key={keyString} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="admin-table__td py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-[13px]">{r.studentName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{r.studentId}</span>
                                                {r.adminNote && (
                                                    <div className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-100 max-w-[200px]">
                                                        <AlertCircle size={10} className="text-slate-400" />
                                                        <span className="text-[9px] text-slate-500 font-medium truncate italic" title={r.adminNote}>
                                                            "{r.adminNote}"
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="admin-table__td py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                                                    {(r.selectedBlock?.blockId || r.selectedBlock?.block_id || '').slice(-2)}
                                                </div>
                                                <span className="font-bold text-slate-700 text-[13px]">{r.selectedBlock?.blockId || r.selectedBlock?.block_id}</span>
                                            </div>
                                        </td>
                                        <td className="admin-table__td py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {/* AI REC */}
                                                {(r.isFromRecommendation || (r as any).IsFromRecommendation) && !(r.isModified || (r as any).IsModified) && (
                                                    <span className="flex items-center gap-1 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                                                        <Sparkles size={12} /> AI REC
                                                    </span>
                                                )}
                                                
                                                {/* MODIFIED */}
                                                {(r.isModified || (r as any).IsModified) && (
                                                    <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                                                        <AlertCircle size={12} /> MODIFIED
                                                    </span>
                                                )}

                                                {/* MANUAL */}
                                                {!(r.isFromRecommendation || (r as any).IsFromRecommendation) && !(r.isModified || (r as any).IsModified) && (
                                                    <span className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                                        <Database size={12} /> MANUAL
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="admin-table__td py-4">
                                            <div className={`flex items-center gap-1.5 font-bold text-[11px] ${
                                                r.status === 'Approved' ? 'text-emerald-500' :
                                                r.status === 'Rejected' ? 'text-rose-500' :
                                                'text-amber-500'
                                            }`}>
                                                {r.status === 'Approved' ? <CheckCircle2 size={14} /> :
                                                r.status === 'Rejected' ? <XCircle size={14} /> :
                                                <Clock size={14} />}
                                                {r.status}
                                            </div>
                                        </td>
                                        <td className="admin-table__td py-4">
                                            <span className="text-[11px] font-bold text-slate-500">{formatDate(r.registeredAt)}</span>
                                        </td>
                                        <td className="admin-table__td py-4 text-center">
                                            <button 
                                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all inline-flex items-center justify-center"
                                                onClick={() => {
                                                    setSelectedReg(r);
                                                    setIsActionModalOpen(true);
                                                }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                            <Filter size={32} />
                        </div>
                        <p className="font-bold text-slate-400">No registrations found</p>
                    </div>
                )}
            </div>



            {/* Registration Details & Action Modal */}
            {isActionModalOpen && selectedReg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="px-8 pt-8 pb-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                        selectedReg.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                        selectedReg.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                        'bg-amber-100 text-amber-600'
                                    }`}>
                                        <ClipboardList size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 leading-tight">Registration Review</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {selectedReg.id}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setIsActionModalOpen(false); setSelectedReg(null); }}
                                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                            
                            {/* Student Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <User size={12} /> Student Name
                                    </label>
                                    <p className="text-sm font-bold text-slate-800">{selectedReg.studentName}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Mail size={12} /> Email Address
                                    </label>
                                    <p className="text-sm font-bold text-slate-800">{selectedReg.studentEmail}</p>
                                </div>
                            </div>

                            {/* Schedule Details */}
                            <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 font-bold">
                                            <BookOpen size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{selectedReg.selectedBlock?.blockId || selectedReg.selectedBlock?.block_id}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{selectedReg.selectedBlock?.semester}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {selectedReg.isFromRecommendation && <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase">Recommendation</span>}
                                            {selectedReg.isFromRl && <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">RL Based</span>}
                                            {selectedReg.isModified && <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[9px] font-black uppercase">Modified</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {selectedReg.selectedBlock?.courses?.map((c: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                <span className="text-xs font-bold text-slate-700">{c.courseName || c.course_name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock3 size={12} />
                                                    {c.day?.slice(0,3)} {c.startTime || c.start_time}-{c.endTime || c.end_time}
                                                </div>
                                                <div className="w-[1px] h-3 bg-slate-100" />
                                                <span>Section {c.section}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Decision Area */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Notes (Internal)</label>
                                    <textarea 
                                        className="w-full h-24 rounded-2xl bg-white border border-slate-200 p-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 focus:border-[#2F80ED] outline-none transition-all resize-none"
                                        placeholder="Add a reason for approval/rejection or special instructions..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-end gap-3">
                            <button 
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                onClick={() => handleAction('Rejected')}
                                disabled={processing}
                            >
                                Reject Schedule
                            </button>
                            <button 
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2F80ED] hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                onClick={() => handleAction('Approved')}
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : 'Approve & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reuse Icon from local if needed
function ClipboardList({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <path d="M12 11h4"/>
            <path d="M12 16h4"/>
            <path d="M8 11h.01"/>
            <path d="M8 16h.01"/>
        </svg>
    );
}
