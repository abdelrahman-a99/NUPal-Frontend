'use client';

import { CourseSession } from '@/types/scheduling';

interface Props {
    courses: CourseSession[];
    onCoursePress?: (course: CourseSession) => void;
}

const formatTime = (time24?: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export default function ScheduleList({ courses, onCoursePress }: Props) {
    return (
        <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((course, idx) => {
                const color = course.color || '#3b82f6';
                const hasSchedule = course.day && course.start && course.end;

                return (
                    <div
                        key={`${course.courseId}-${idx}`}
                        className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                        onClick={() => onCoursePress?.(course)}
                    >
                        {/* Left color bar */}
                        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />

                        <div className="flex-1 p-4">
                            {/* Title */}
                            <h4 className="text-sm font-bold text-sky-600 group-hover:text-sky-700 transition-colors mb-1.5">
                                {course.courseId}: {course.courseName}
                            </h4>

                            {/* Status badge */}
                            {course.status && (
                                <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 mb-2">
                                    {course.status}
                                </span>
                            )}

                            {/* Details */}
                            <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {(course.section || course.session || course.subtype) && (
                                    <p>
                                        {course.section && `Section: ${course.section}`}
                                        {course.session && ` | Session: ${course.session}`}
                                        {course.subtype && ` | ${course.subtype}`}
                                    </p>
                                )}
                                {course.duration && (
                                    <p>
                                        Duration: {course.duration}
                                    </p>
                                )}
                                {course.credits && (
                                    <p>Credits: {course.credits.toFixed(2)}{course.creditType && ` | ${course.creditType}`}</p>
                                )}
                                <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                                    {hasSchedule
                                        ? `${formatTime(course.start)} - ${formatTime(course.end)} ${course.day}`
                                        : 'No schedule'}
                                </p>
                                <p>Instructor: {course.instructor || 'Staff'}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
