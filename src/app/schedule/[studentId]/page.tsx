'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, User as UserIcon, BookOpen, ShieldCheck } from 'lucide-react';

// Mock data for the public schedule view
const MOCK_SCHEDULE = {
    semester: "Fall 2026",
    totalCredits: 15,
    courses: [
        { courseName: "CSCI 313: Algorithms", credit: 3, day: "Mon/Wed", start: "10:00", end: "11:30", instructor: "Dr. Smith", room: "Room 101" },
        { courseName: "SWE 421: Software Engineering", credit: 3, day: "Tue/Thu", start: "13:00", end: "14:30", instructor: "Prof. Johnson", room: "Lab A" },
        { courseName: "MATH 205: Linear Algebra", credit: 3, day: "Mon/Wed", start: "14:00", end: "15:30", instructor: "Dr. Lee", room: "Room 205" },
        { courseName: "CSCI 450: AI", credit: 3, day: "Tue/Thu", start: "09:00", end: "10:30", instructor: "Dr. Ahmed", room: "Room 304" },
        { courseName: "ENG 102: English Composition", credit: 3, day: "Friday", start: "10:00", end: "13:00", instructor: "Prof. Davis", room: "Room 112" },
    ]
};

export default function PublicSchedulePage() {
    const params = useParams();
    const [studentName, setStudentName] = useState('Student');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking a network delay
        const timer = setTimeout(() => {
            if (params.studentId) {
                // Format the ID from "abdelrahman-ahmed" to "Abdelrahman Ahmed"
                const nameParts = (params.studentId as string).split('-');
                const formattedName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                setStudentName(formattedName);
            }
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [params.studentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Loading secure public schedule...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 mb-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-3xl font-black text-blue-600 dark:text-blue-300">{studentName.charAt(0)}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-3xl font-black text-white">{studentName}</h1>
                                    <ShieldCheck size={20} className="text-blue-300" />
                                </div>
                                <p className="text-blue-100 font-medium flex items-center gap-2">
                                    <Calendar size={16} /> {MOCK_SCHEDULE.semester} Schedule
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-4 text-center">
                            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Total Credits</p>
                            <p className="text-3xl font-black text-white">{MOCK_SCHEDULE.totalCredits}</p>
                        </div>
                    </div>
                </div>

                {/* Privacy Banner */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 mb-8 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Privacy Protected View</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">This is a public, read-only schedule link. Grades, GPA, and personal identification numbers are strictly hidden.</p>
                    </div>
                </div>

                {/* Schedule List */}
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-500" />
                    Registered Courses ({MOCK_SCHEDULE.courses.length})
                </h2>

                <div className="space-y-4">
                    {MOCK_SCHEDULE.courses.map((course, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{course.courseName}</h3>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {course.credit} cr
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 pl-5">
                                        <span className="flex items-center gap-1.5 font-medium"><UserIcon size={14} /> {course.instructor}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={14} /> {course.room}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3 md:min-w-[140px] border border-slate-100 dark:border-slate-800 pl-5 md:pl-3">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{course.day}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                        <Clock size={14} className="text-blue-500" />
                                        {course.start} - {course.end}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
