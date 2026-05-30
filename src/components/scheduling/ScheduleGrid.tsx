'use client';

import { CourseSession, DayOfWeek } from '@/types/scheduling';

interface Props {
    courses: CourseSession[];
    onCoursePress?: (course: CourseSession) => void;
    onCourseRemove?: (course: CourseSession) => void;
    onCourseEdit?: (course: CourseSession) => void;
}

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const START_HOUR = 7;
const END_HOUR = 21; // 9 PM
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

const ROW_HEIGHT = 38; // Reduced to fit without scroll
const TIME_COL_WIDTH = 64;
const HEADER_HEIGHT = 38;

const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mm = m.toString().padStart(2, '0');
    return `${h12}:${mm} ${ampm}`;
};

const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:00 ${ampm}`;
};

export default function ScheduleGrid({ courses, onCoursePress, onCourseRemove, onCourseEdit }: Props) {
    const daysToShow = DAYS;

    const normalizeDay = (day: string): DayOfWeek | null => {
        if (!day) return null;
        const d = day.trim().toLowerCase();
        if (d.startsWith('sun')) return 'Sunday';
        if (d.startsWith('mon')) return 'Monday';
        if (d.startsWith('tue')) return 'Tuesday';
        if (d.startsWith('wed')) return 'Wednesday';
        if (d.startsWith('thu')) return 'Thursday';
        if (d.startsWith('fri')) return 'Friday';
        if (d.startsWith('sat')) return 'Saturday';
        return null;
    };

    const getBlockStyle = (course: CourseSession): React.CSSProperties | null => {
        if (!course.day || !course.start || !course.end) return null;
        const normalizedDay = normalizeDay(course.day);
        if (!normalizedDay) return null;

        const dayIndex = daysToShow.indexOf(normalizedDay);
        if (dayIndex === -1) return null;

        const [startH, startM] = course.start.split(':').map(Number);
        const [endH, endM] = course.end.split(':').map(Number);

        // Positioning math - Note: Parent container starts AFTER Header
        const top = (startH - START_HOUR) * ROW_HEIGHT + (startM / 60) * ROW_HEIGHT;
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const height = (durationMinutes / 60) * ROW_HEIGHT;
        
        // Horizontal positioning as percentage of the remaining 7-day width
        const left = (dayIndex / 7) * 100;
        const width = 100 / 7;

        return {
            position: 'absolute',
            top: top + 1, 
            left: `${left}%`,
            width: `calc(${width}% - 4px)`,
            height: height - 2,
            zIndex: 20
        };
    };

    const totalHeight = HEADER_HEIGHT + HOURS.length * ROW_HEIGHT;

    return (
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-x-auto md:overflow-hidden shadow-inner">
            <div className="relative min-w-[750px] md:min-w-0 md:w-full overflow-hidden" style={{ height: totalHeight }}>
                {/* Header row */}
                <div className="flex sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200" style={{ height: HEADER_HEIGHT }}>
                    <div className="flex-shrink-0 border-r border-slate-200" style={{ width: TIME_COL_WIDTH }} />
                    <div className="flex-1 flex">
                        {daysToShow.map((day, idx) => (
                            <div
                                key={day}
                                className={`flex-1 flex items-center justify-center text-[11px] font-bold text-slate-500 uppercase tracking-wider ${
                                    idx !== daysToShow.length - 1 ? 'border-r border-slate-100' : ''
                                }`}
                            >
                                {day.slice(0, 3)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid body */}
                <div className="relative">
                    {HOURS.map(hour => (
                        <div key={hour} className="flex border-b border-slate-100/60" style={{ height: ROW_HEIGHT }}>
                            <div
                                className="flex-shrink-0 flex items-center justify-center border-r border-slate-200 text-[10px] font-bold text-slate-400 bg-slate-50/30"
                                style={{ width: TIME_COL_WIDTH }}
                            >
                                {formatHour(hour)}
                            </div>
                            <div className="flex-1 flex">
                                {daysToShow.map((day, idx) => (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={`flex-1 ${idx !== daysToShow.length - 1 ? 'border-r border-slate-50/50' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Course blocks - Wrapped in an absolute container that matches the columns AREA */}
                    <div className="absolute top-0 bottom-0 right-0 pointer-events-none" style={{ left: TIME_COL_WIDTH }}>
                        {courses.map((course, idx) => {
                            const style = getBlockStyle(course);
                            if (!style) return null;
                            const color = course.color || '#3b82f6';

                            return (
                                <div
                                    key={`${course.courseId}-${idx}`}
                                    className="rounded-lg bg-white shadow-sm border border-slate-200/60 cursor-pointer overflow-hidden group pointer-events-auto"
                                    style={{ ...style, borderLeftWidth: 4, borderLeftColor: color }}
                                    onClick={() => onCoursePress?.(course)}
                                >
                                    <div className="px-2 py-1.5 h-full flex flex-col justify-center relative">
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onCourseRemove && (
                                                <button 
                                                    className="w-5 h-5 rounded flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCourseRemove(course);
                                                    }}
                                                    title="Remove Course"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M18 6L6 18M6 6l12 12"/>
                                                    </svg>
                                                </button>
                                            )}
                                            {onCourseEdit && (
                                                <button 
                                                    className="w-5 h-5 rounded flex items-center justify-center bg-blue-50 text-blue-500 hover:bg-blue-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCourseEdit(course);
                                                    }}
                                                    title="Edit Course"
                                                >
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold leading-none pr-4">
                                            {formatTime(course.start)}
                                        </p>
                                        <p className="text-[11px] font-bold text-slate-800 leading-tight mt-0.5 truncate pr-4 group-hover:text-blue-600 transition-colors">
                                            {course.courseName}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5 pr-4">
                                            <p className="text-[9px] font-bold text-slate-500/80 truncate">
                                                {course.section ? `Sec ${course.section}` : course.room || ''}
                                            </p>
                                            {course.subtype && (
                                                <span className={`text-[8px] font-bold px-1 rounded-sm uppercase ${course.subtype.toLowerCase().includes('lecture') ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                                                    {course.subtype}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
