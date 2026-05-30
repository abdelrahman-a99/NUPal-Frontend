'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calendar, CreditCard, X } from 'lucide-react';
import { Block, CourseSession } from '@/types/scheduling';
import ScheduleGrid from './ScheduleGrid';
import CourseDetailPanel from './CourseDetailModal';

interface Props {
    block: Block;
}

export default function BlockCard({ block }: Props) {
    const [showSchedule, setShowSchedule] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<CourseSession | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const uniqueDays = useMemo(
        () => [...new Set(block.courses.map(c => c.day))],
        [block.courses]
    );

    // Close modal on Escape
    useEffect(() => {   
        if (!showSchedule) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSchedule(false); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [showSchedule]);

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3.5 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Card header */}
                <div className="flex items-start mb-2.5">
                    <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                            {block.blockId}
                            {block.semester && <span className="text-slate-400 dark:text-slate-400 font-normal text-xs ml-1.5">· {block.semester}</span>}
                        </h4>
                        <div className="flex items-center gap-2.5 text-[12px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium">
                                <CreditCard size={13} strokeWidth={2} />
                                {block.totalCredits} credits
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                                <Calendar size={13} strokeWidth={2} />
                                {uniqueDays.length} day{uniqueDays.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Day badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {uniqueDays.map(d => (
                        <span key={d} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                            {d.slice(0, 3)}
                        </span>
                    ))}
                </div>

                {/* Action button */}
                <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/30 hover:bg-[#2F80ED] text-[#2F80ED] hover:text-white text-sm font-semibold transition-all duration-300"
                    onClick={() => setShowSchedule(true)}
                >
                    <Calendar size={15} strokeWidth={2} />
                    View Schedule
                </button>
            </div>

            {/* Schedule Preview Modal */}
            {showSchedule && (
                <div
                    ref={modalRef}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
                    onClick={(e) => { if (e.target === modalRef.current) setShowSchedule(false); }}
                >
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.3)] w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-400">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{block.blockId}</h3>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">Schedule Preview</p>
                            </div>
                            <button
                                onClick={() => setShowSchedule(false)}
                                className="px-3 py-1 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-50 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <div className="h-full p-4 overflow-hidden">
                                <ScheduleGrid
                                    courses={block.courses}
                                    onCoursePress={(c) => setSelectedCourse(c)}
                                />
                            </div>

                            {/* Floating Detail Popup - Matches Recommendations structure */}
                            {selectedCourse && (
                                <div 
                                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-[1px] p-4 animate-in fade-in duration-200"
                                    onClick={() => setSelectedCourse(null)}
                                >
                                    <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
                                        <CourseDetailPanel
                                            course={selectedCourse}
                                            visible={!!selectedCourse}
                                            onClose={() => setSelectedCourse(null)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
