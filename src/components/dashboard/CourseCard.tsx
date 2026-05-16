import React, { useState } from 'react';
import { Course, CourseStatus } from '../../types/roadmap';
import { GraduationCap, Clock, Hash, Trophy, Flag } from 'lucide-react';

interface CourseCardProps {
    course: Course;
}

const getStatusStyles = (status: CourseStatus) => {
    switch (status) {
        case 'Completed':
            return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200';
        case 'In Progress':
            return 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 hover:bg-amber-200';
        case 'Failed':
            return 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200 dark:border-rose-800/60';
        case 'Not Taken':
        default:
            return 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm';
    }
};

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mb-3">
            {/* Main "Badge" Trigger - Looks like the "Not started" bar in the image */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                title={course.name}
                className={`
                    w-full px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 select-none text-center
                    truncate block
                    ${getStatusStyles(course.status)}
                    ${isExpanded ? 'opacity-90 mb-2' : 'hover:bg-opacity-80 shadow-sm'}
                    border border-slate-200/50 dark:border-slate-700/50
                `}
            >
                {course.name}
            </div>

            {/* Expanded Details - Looks like the White Card (FWCYL...) in the image */}
            {isExpanded && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm animate-in fade-in duration-150 ease-out">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                {course.id}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                {course.name}
                            </span>
                        </div>
                        {course.grade ? (
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                                {course.grade}
                            </span>
                        ) : (
                            <Flag size={12} className="text-slate-300" />
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-slate-50 dark:bg-slate-900/70 my-2"></div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap size={12} className="text-slate-400 dark:text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-semibold">Credits</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{course.credits}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-400 dark:text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-semibold">Status</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{course.status}</span>
                            </div>
                        </div>

                        {course.gpa !== undefined && course.gpa !== null && (
                            <div className="flex items-center gap-2 col-span-2 mt-1 bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Trophy size={12} className="text-slate-400 dark:text-slate-400" />
                                <div className="flex items-center gap-2 w-full justify-between">
                                    <span className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-bold">GPA Points</span>
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{course.gpa.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseCard;
