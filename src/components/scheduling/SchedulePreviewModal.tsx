import CourseDetailModal from '@/components/scheduling/CourseDetailModal';
import ScheduleGrid from '@/components/scheduling/ScheduleGrid';
import { CourseSession } from '@/types/scheduling';
import { useState, useMemo, useEffect } from 'react';
import { Library, Check, X } from 'lucide-react';

const canonicalCourseKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function SchedulePreviewModal({
    previewBlock,
    setPreviewBlock,
    previewCourse,
    setPreviewCourse,
    completedCourseBlockNames = [],
    initialHideCompleted = true
}: {
    previewBlock: CourseSession[] | null;
    setPreviewBlock: (b: CourseSession[] | null) => void;
    previewCourse: CourseSession | null;
    setPreviewCourse: (c: CourseSession | null) => void;
    completedCourseBlockNames?: string[];
    initialHideCompleted?: boolean;
}) {
    const [hideCompleted, setHideCompleted] = useState(initialHideCompleted);

    // Sync state when modal opens
    useEffect(() => {
        if (previewBlock) {
            setHideCompleted(initialHideCompleted);
        }
    }, [previewBlock, initialHideCompleted]);

    const displayedCourses = useMemo(() => {
        if (!previewBlock) return null;
        if (!hideCompleted) return previewBlock;
        return previewBlock.filter(c => !completedCourseBlockNames.some(cn => canonicalCourseKey(cn) === canonicalCourseKey(c.courseName)));
    }, [previewBlock, hideCompleted, completedCourseBlockNames]);

    const hasHiddenCourses = useMemo(() => {
        if (!previewBlock) return false;
        return previewBlock.some(c => completedCourseBlockNames.some(cn => canonicalCourseKey(cn) === canonicalCourseKey(c.courseName)));
    }, [previewBlock, completedCourseBlockNames]);

    return (
        <>
            {previewBlock && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setPreviewBlock(null); }}
                >
                    <div className="bg-white rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.3)] w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-400">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Schedule Preview</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Smart Recommendation</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {hasHiddenCourses && initialHideCompleted && (
                                    <button 
                                        onClick={() => setHideCompleted(prev => !prev)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${hideCompleted ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <Library size={14} />
                                        <span>Hide Completed</span>
                                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${hideCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                                            {hideCompleted && <Check size={10} strokeWidth={3} />}
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={() => setPreviewBlock(null)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all active:scale-95"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 scrollbar-hide">
                            <ScheduleGrid
                                courses={displayedCourses || []}
                                onCoursePress={c => setPreviewCourse(c)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <CourseDetailModal
                course={previewCourse}
                visible={!!previewCourse}
                onClose={() => setPreviewCourse(null)}
            />
        </>
    );
}
