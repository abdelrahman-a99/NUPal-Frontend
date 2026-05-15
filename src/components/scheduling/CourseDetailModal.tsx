'use client';

import { useEffect, useRef } from 'react';
import { X, Clock, User, MapPin, BookOpen } from 'lucide-react';
import { CourseSession } from '@/types/scheduling';

interface Props {
    course: CourseSession | null;
    visible: boolean;
    onClose: () => void;
}

export default function CourseDetailPanel({ course, visible, onClose }: Props) {
    if (!visible || !course) return null;

    const color = course.color || '#3b82f6';

    const rows: { icon: React.FC<any>; label: string; value: string }[] = [
        { icon: BookOpen, label: 'Course ID', value: course.courseId },
        { icon: User, label: 'Instructor', value: course.instructor },
        { icon: Clock, label: 'Time', value: `${course.day}  •  ${course.start} – ${course.end}` },
    ];
    if (course.room) rows.push({ icon: MapPin, label: 'Room', value: course.room });
    if (course.section) rows.push({ icon: BookOpen, label: 'Section', value: course.section });
    if (course.credits) rows.push({ icon: BookOpen, label: 'Credits', value: course.credits.toFixed(2) });

    return (
        <div 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl flex flex-col animate-in zoom-in-95 duration-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                {/* Visual Accent bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                {/* Header Section */}
                <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: color + '15', color }}>
                                Course Details
                            </span>
                            {course.subtype && (
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${course.subtype.toLowerCase().includes('lecture') ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                                    {course.subtype}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{course.courseName}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content Section */}
                <div className="px-5 pb-6 pt-1 space-y-4 overflow-y-auto flex-1">
                    {rows.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-4">
                            <div className="pt-1.5 text-slate-400">
                                <Icon size={18} strokeWidth={2.2} />
                            </div>
                            <div className="pt-0.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                                <p className="text-sm font-bold text-slate-700 leading-snug">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
