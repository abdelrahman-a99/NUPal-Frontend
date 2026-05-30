'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, parseJwt, removeToken } from '@/lib/auth';
import { getStudentByEmail, StudentResponse } from '@/services/studentService';
import { getMyRegistration } from '@/services/schedulingApi';
import {
    User, Mail, BookOpen, Award, TrendingUp, Calendar,
    GraduationCap, BarChart2, Clock, CheckCircle, XCircle,
    AlertCircle, Layers, Target, ChevronDown, ChevronUp,
    Briefcase, Star
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGPAColor(gpa: number) {
    if (gpa >= 3.7) return 'text-emerald-600 dark:text-emerald-300';
    if (gpa >= 3.0) return 'text-blue-600 dark:text-blue-300';
    if (gpa >= 2.0) return 'text-amber-600 dark:text-amber-300';
    return 'text-red-500';
}

function getGPABadge(gpa: number) {
    if (gpa >= 3.7) return { label: "Excellent", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60" };
    if (gpa >= 3.0) return { label: "Good Standing", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60" };
    if (gpa >= 2.0) return { label: "Satisfactory", color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60" };
    return { label: "At Risk", color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60" };
}

function getAcademicLevel(credits: number) {
    if (credits <= 35) return { level: "Freshman", short: "FR", color: "bg-violet-100 text-violet-700 dark:text-violet-300" };
    if (credits <= 70) return { level: "Sophomore", short: "SO", color: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" };
    if (credits <= 105) return { level: "Junior", short: "JR", color: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" };
    return { level: "Senior", short: "SR", color: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" };
}

function getRegistrationBadge(reg: any) {
    if (!reg) return null;
    const status = reg.status?.toLowerCase();
    if (status === 'approved') return { label: 'Approved', icon: CheckCircle, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' };
    if (status === 'rejected') return { label: 'Rejected', icon: XCircle, color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60' };
    return { label: 'Pending Review', icon: AlertCircle, color: 'bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-300/25' };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'text-blue-600 dark:text-blue-300', bg = 'bg-blue-50 dark:bg-blue-950/40' }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`${bg} p-3 rounded-xl flex-shrink-0`}>
                <Icon size={20} className={color} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
                {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function SemesterRow({ semester, index }: { semester: any; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 w-6">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{semester.term}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-400">{semester.courses.length} courses · {semester.semesterCredits} credits</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className={`text-base font-black ${getGPAColor(semester.semesterGpa)}`}>{semester.semesterGpa.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">SEM GPA</p>
                    </div>
                    <div className="text-right">
                        <p className="text-base font-black text-slate-700 dark:text-slate-200">{semester.cumulativeGpa.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">CUM GPA</p>
                    </div>
                    {open ? <ChevronUp size={16} className="text-slate-400 dark:text-slate-400" /> : <ChevronDown size={16} className="text-slate-400 dark:text-slate-400" />}
                </div>
            </button>
            {open && (
                <div className="px-5 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <table className="w-full text-sm mt-2">
                        <thead>
                            <tr className="text-left">
                                <th className="pb-2 font-semibold text-slate-400 dark:text-slate-400 text-xs uppercase tracking-wider">Course</th>
                                <th className="pb-2 font-semibold text-slate-400 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Cr</th>
                                <th className="pb-2 font-semibold text-slate-400 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Grade</th>
                                <th className="pb-2 font-semibold text-slate-400 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {semester.courses.map((c: any, i: number) => (
                                <tr key={i} className="group">
                                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100 pr-4">{c.courseName}</td>
                                    <td className="py-2.5 text-center text-slate-500 dark:text-slate-400">{c.credit}</td>
                                    <td className="py-2.5 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                            c.grade === 'A' || c.grade === 'A+' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                            : c.grade === 'B' || c.grade === 'B+' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                            : c.grade === 'C' || c.grade === 'C+' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                            : c.grade === 'P' ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                                        }`}>{c.grade}</span>
                                    </td>
                                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{c.gpa != null ? c.gpa.toFixed(2) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter();
    const [student, setStudent] = useState<StudentResponse | null>(null);
    const [registration, setRegistration] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [showRegistrationAlerts, setShowRegistrationAlerts] = useState(true);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('nupal_student_settings');
            if (raw) {
                const s = JSON.parse(raw);
                setShowRegistrationAlerts(s.scheduleApprovalAlerts !== false);
            }
        } catch {}
    }, []);

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const user = parseJwt(token);
        if (!user) { removeToken(); router.push('/login'); return; }
        if (user.role === 'admin') { router.push('/admin'); return; }
        setUserName(user.name || '');
        setUserEmail(user.email || '');

        Promise.all([
            getStudentByEmail(user.email),
            getMyRegistration().catch(() => null),
        ]).then(([s, r]) => {
            setStudent(s);
            setRegistration(r);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading profile…</p>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70 flex items-center justify-center">
                <p className="text-red-500">Could not load student profile.</p>
            </div>
        );
    }

    const { education, account } = student;
    const lastSem = education.semesters[education.semesters.length - 1];
    const cumGPA = lastSem?.cumulativeGpa ?? 0;
    const latestGPA = lastSem?.semesterGpa ?? 0;
    const level = getAcademicLevel(education.totalCredits);
    const gpaBadge = getGPABadge(cumGPA);
    const regBadge = getRegistrationBadge(registration);
    const initial = (account.name?.charAt(0) ?? '').toUpperCase();

    const totalCourses = education.semesters.reduce((a, s) => a + s.courses.length, 0);
    const passedCourses = education.semesters.reduce((a, s) =>
        a + s.courses.filter(c => c.grade && c.grade !== 'F' && c.grade !== 'W').length, 0);
    const bestSem = [...education.semesters].sort((a, b) => b.semesterGpa - a.semesterGpa)[0];
    const creditsRemaining = 135 - education.totalCredits;

    // GPA trend arrow
    const sems = education.semesters;
    const gpaTrend = sems.length >= 2
        ? sems[sems.length - 1].semesterGpa - sems[sems.length - 2].semesterGpa
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70">
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 pt-14 pb-32 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-900/40">
                                <span className="text-4xl font-black text-white">{initial}</span>
                            </div>
                            <div className={`absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full text-[11px] font-black border ${level.color} shadow-sm`}>
                                {level.short}
                            </div>
                        </div>

                        {/* Name & meta */}
                        <div className="flex-1 min-w-0 pb-1">
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                {account.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="flex items-center gap-1.5 text-slate-300 text-sm font-medium">
                                    <Mail size={13} className="opacity-70" />{account.email}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${gpaBadge.color}`}>
                                    <Star size={11} fill="currentColor" />
                                    {gpaBadge.label}
                                </span>
                                {regBadge && showRegistrationAlerts && (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${regBadge.color}`}>
                                        <regBadge.icon size={11} />
                                        Schedule {regBadge.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg className="relative block w-full h-12" viewBox="0 0 1200 60" preserveAspectRatio="none">
                        <path d="M0,30 C300,60 900,0 1200,30 L1200,60 L0,60 Z" className="fill-slate-50" />
                    </svg>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 -mt-16 pb-20">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={BarChart2} label="Cumulative GPA" value={cumGPA.toFixed(2)} sub={gpaBadge.label}
                        color="text-blue-600 dark:text-blue-300" bg="bg-blue-50 dark:bg-blue-950/40" />
                    <StatCard icon={TrendingUp} label="Latest Semester GPA" value={latestGPA.toFixed(2)}
                        sub={gpaTrend >= 0 ? `↑ ${gpaTrend.toFixed(2)} vs prev` : `↓ ${Math.abs(gpaTrend).toFixed(2)} vs prev`}
                        color={gpaTrend >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-red-500"}
                        bg={gpaTrend >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40"} />
                    <StatCard icon={BookOpen} label="Total Credits" value={education.totalCredits}
                        sub={`${creditsRemaining > 0 ? creditsRemaining + ' to graduate' : 'Graduation eligible'}`}
                        color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/40" />
                    <StatCard icon={GraduationCap} label="Academic Level" value={level.level}
                        sub={`${education.numSemesters} semester${education.numSemesters !== 1 ? 's' : ''} completed`}
                        color="text-amber-600 dark:text-amber-300" bg="bg-amber-50 dark:bg-amber-950/40" />
                </div>

                {/* Second row stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={Layers} label="Total Courses" value={totalCourses} sub={`${passedCourses} passed`}
                        color="text-cyan-600" bg="bg-cyan-50" />
                    <StatCard icon={Award} label="Best Semester" value={bestSem?.semesterGpa.toFixed(2) ?? '—'}
                        sub={bestSem?.term ?? ''}
                        color="text-pink-600" bg="bg-pink-50" />
                    <StatCard icon={Target} label="Credits Needed" value={creditsRemaining > 0 ? creditsRemaining : 0}
                        sub="to reach 135 credits"
                        color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/40" />
                    <StatCard icon={Calendar} label="Semesters" value={education.numSemesters}
                        sub={`${lastSem?.term ?? ''}`}
                        color="text-teal-600" bg="bg-teal-50" />
                </div>

                {/* Progress bar – credits */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Graduation Progress</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Target: 135 credits · Current level: <span className="font-semibold text-slate-600 dark:text-slate-300">{level.level}</span></p>
                        </div>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-100">{Math.min(100, Math.round((education.totalCredits / 135) * 100))}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (education.totalCredits / 135) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[11px] text-slate-400 dark:text-slate-400 font-semibold">
                        <span>0 – FR</span><span>36 – SO</span><span>71 – JR</span><span>106 – SR</span><span>135</span>
                    </div>
                </div>

                {/* Registration Info */}
                {registration && showRegistrationAlerts && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                                <Briefcase size={16} className="text-slate-400 dark:text-slate-400" />
                                Current Schedule Registration
                            </h3>
                            {regBadge && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${regBadge.color}`}>
                                    <regBadge.icon size={12} />
                                    {regBadge.label}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Block ID</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{registration.selectedBlock?.blockId ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Semester</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{registration.selectedBlock?.semester ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Credits</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{registration.selectedBlock?.totalCredits ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Method</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">
                                    {registration.isFromRl ? 'AI-Recommended (RL)' : registration.isFromRecommendation ? 'AI-Recommended' : 'Manual'}
                                    {registration.isModified && <span className="text-amber-600 dark:text-amber-300"> (Modified)</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Registered At</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{registration.registeredAt ? new Date(registration.registeredAt).toLocaleDateString() : '—'}</p>
                            </div>
                            {registration.adminNote && (
                                <div className="md:col-span-2">
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Admin Note</p>
                                    <p className="font-medium text-slate-700 dark:text-slate-200 italic">{registration.adminNote}</p>
                                </div>
                            )}
                        </div>

                        {/* Courses in the registered block */}
                        {registration.selectedBlock?.courses?.length > 0 && (
                            <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">Registered Courses</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {registration.selectedBlock.courses.map((c: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{c.courseName}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-400">{c.day} · {c.start}–{c.end} · {c.instructor}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Semester History */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                                <Clock size={16} className="text-slate-400 dark:text-slate-400" />
                                Full Academic Transcript
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">All {education.numSemesters} semesters — click to expand courses</p>
                        </div>
                    </div>
                    <div>
                        {[...education.semesters].reverse().map((sem, i) => (
                            <SemesterRow key={sem.term} semester={sem} index={education.semesters.length - 1 - i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
