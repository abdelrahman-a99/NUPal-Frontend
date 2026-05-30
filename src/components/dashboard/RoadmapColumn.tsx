import React, { useState } from 'react';
import { Course } from '../../types/roadmap';
import CourseCard from './CourseCard';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

interface RoadmapColumnProps {
    title: string;
    courses: Course[];
    groups?: { title: string; courses: Course[] }[]; // Optional prop for grouped courses
    defaultCollapsed?: boolean;
}

// Helper component for collapsible groups
const RoadmapGroupItem = ({ group }: { group: { title: string; courses: Course[] } }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mb-2 last:mb-0">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between cursor-pointer hover:bg-slate-100/50 p-1.5 rounded-lg transition-colors group/header select-none"
            >
                <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider group-hover/header:text-slate-600 transition-colors">
                    {group.title}
                </h5>
                <div className="text-slate-300 group-hover/header:text-slate-500 transition-colors">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </div>

            {isOpen && (
                <div className="flex flex-col gap-2 mt-1 animate-in slide-in-from-top-1 duration-200">
                    {group.courses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
};

const RoadmapColumn: React.FC<RoadmapColumnProps> = ({
    title,
    courses,
    groups,
    defaultCollapsed = false
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    // Calculate total courses count (flat + groups)
    const totalCourses = groups ? groups.reduce((acc, g) => acc + g.courses.length, 0) : courses.length;

    return (
        <div className={`
            flex flex-col w-full
            bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-4
            transition-all duration-300 h-fit shadow-sm
        `}>
            {/* Column Header */}
            <div
                className="flex items-center justify-between mb-3 cursor-pointer select-none group"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-slate-900 transition-colors">{title}</h4>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">
                        {totalCourses}
                    </span>
                </div>
                <div className="text-slate-400 dark:text-slate-400 group-hover:text-slate-600 transition-colors">
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
            </div>

            {!isCollapsed && (
                <div className="flex flex-col gap-2 min-h-[50px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-gutter-stable pr-3">
                    {groups ? (
                        // Render Grouped Sections
                        groups.map((group, idx) => (
                            <RoadmapGroupItem key={idx} group={group} />
                        ))
                    ) : (
                        // Render Flat List
                        courses.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-md">
                                <p className="text-slate-400 dark:text-slate-400 text-xs font-medium">Empty</p>
                            </div>
                        ) : (
                            courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default RoadmapColumn;
