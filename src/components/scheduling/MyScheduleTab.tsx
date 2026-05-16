import { useState, useMemo, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, CalendarDays, Check, Info, List, Loader2, ShoppingCart, AlertCircle, Sparkles, Database, X, Clock } from 'lucide-react';
import { MY_SCHEDULE_COURSES } from '@/data/schedulingData';
import { CourseSession } from '@/types/scheduling';
import ScheduleGrid from '@/components/scheduling/ScheduleGrid';
import ScheduleList from '@/components/scheduling/ScheduleList';
import CourseDetailModal from '@/components/scheduling/CourseDetailModal';
import { schedulingApi } from '@/services/schedulingApi';

export default function MyScheduleTab({
    viewMode,
    setViewMode,
    registration,
    latestRegistration,
    onRefresh,
    studentData,
    activeSemester,
    originalRecBlock,
    useMyData,
    rlRecommendedNames
}: {
    viewMode: 'list' | 'grid';
    setViewMode: (m: 'list' | 'grid') => void;
    registration: any | null;
    latestRegistration?: any | null;
    onRefresh: () => void;
    studentData: any | null;
    activeSemester: string | null;
    originalRecBlock?: any | null;
    useMyData?: boolean | null;
    rlRecommendedNames?: string[];
}) {
    const [selectedCourse, setSelectedCourse] = useState<CourseSession | null>(null);
    const [registering, setRegistering] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [showApprovalAlerts, setShowApprovalAlerts] = useState(() => {
        if (typeof window === 'undefined') return true;
        try {
            const raw = localStorage.getItem('nupal_student_settings');
            if (raw) {
                const s = JSON.parse(raw);
                return s.scheduleApprovalAlerts !== false;
            }
        } catch {}
        return true;
    });

    const syncSettings = useCallback(() => {
        try {
            const raw = localStorage.getItem('nupal_student_settings');
            if (raw) {
                const s = JSON.parse(raw);
                setShowApprovalAlerts(s.scheduleApprovalAlerts !== false);
                
                // Persist view mode preference (read-only sync)
                const savedView = localStorage.getItem('nupal_schedule_view_mode');
                if (savedView === 'grid' || savedView === 'list') {
                    setViewMode(savedView as 'list' | 'grid');
                }
            }
        } catch {}
    }, [setViewMode]);

    useEffect(() => {
        syncSettings();
        window.addEventListener('focus', syncSettings);
        window.addEventListener('storage', syncSettings);
        window.addEventListener('nupal-settings-updated', syncSettings);
        return () => {
            window.removeEventListener('focus', syncSettings);
            window.removeEventListener('storage', syncSettings);
            window.removeEventListener('nupal-settings-updated', syncSettings);
        };
    }, [syncSettings]);

    // Update persisted view mode when changed
    const handleSetViewMode = (m: 'list' | 'grid') => {
        setViewMode(m);
        localStorage.setItem('nupal_schedule_view_mode', m);
    };

    // One-time notification logic
    useEffect(() => {
        if (latestRegistration && (latestRegistration.status === 'Approved' || latestRegistration.status === 'Rejected')) {
            const regId = latestRegistration.id || latestRegistration._id;
            const storageKey = `nupal_reg_seen_${regId}_${latestRegistration.status}`;
            const hasSeen = localStorage.getItem(storageKey);
            
            if (!hasSeen) {
                setBannerVisible(true);
                // Mark as seen immediately so it doesn't show again next time
                localStorage.setItem(storageKey, 'true');
            }
        }
    }, [latestRegistration]);

    const registeredCourses = registration?.selectedBlock?.courses?.map((c: any) => ({
        courseName: c.courseName || c.course_name || '',
        section: c.section,
        type: c.type,
        instructor: c.instructor,
        day: c.day,
        start: c.startTime || c.start_time || '',
        end: c.endTime || c.end_time || '',
        room: c.room,
        credits: 3
    })) || [];

    // If there's an active registration (Pending/Approved), show it.
    // If the latest registration was rejected, show empty (deleted).
    // Otherwise, show the default sample courses.
    const isRejected = latestRegistration?.status === 'Rejected' && !registration;
    const displayCourses = registeredCourses.length > 0 ? registeredCourses : (isRejected ? [] : MY_SCHEDULE_COURSES);

    // Logic to determine the method based on your requirements
    const registrationStatus = useMemo(() => {
        // 1. MANUAL: If student picked "Browse Catalog"
        if (useMyData === false) {
            return { label: 'MANUAL', isFromRec: false, isModified: false };
        }
        
        // 2. If student picked "Sync with Advisor" (RL)
        if (useMyData === true) {
            const originalSorted = [...(rlRecommendedNames || [])].sort();
            const currentCourseNames = Array.from(new Set(displayCourses.map((c: any) => c.courseName))).sort();
            
            const isModified = JSON.stringify(originalSorted) !== JSON.stringify(currentCourseNames);
            
            return {
                label: isModified ? 'MODIFIED' : 'AI REC',
                isFromRec: true,
                isModified: isModified
            };
        }

        // Fallback for safety
        return { label: 'MANUAL', isFromRec: false, isModified: false };
    }, [useMyData, rlRecommendedNames, displayCourses]);

    const handleRegisterCurrent = async () => {
        if (!studentData) return;
        setRegistering(true);
        try {
            await schedulingApi.registerSchedule({
                studentId: studentData.account.id,
                studentName: studentData.account.name,
                studentEmail: studentData.account.email,
                selectedBlock: {
                    blockId: originalRecBlock?.blockId || "Manual-Selection",
                    semester: activeSemester || "Fall 2025",
                    courses: displayCourses.map((c: any) => ({
                        courseName: c.courseName,
                        section: c.section,
                        type: c.type,
                        instructor: c.instructor,
                        day: c.day,
                        startTime: c.start,
                        endTime: c.end,
                        room: c.room
                    }))
                },
                isFromRecommendation: registrationStatus.isFromRec,
                isFromRl: registrationStatus.isFromRec,
                isModified: registrationStatus.isModified
            });
            alert("Schedule submitted for approval!");
            onRefresh();
        } catch (e: any) {
            alert("Failed to submit: " + (e as any).message);
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div>
            {/* 1. Permanent Status Banner for PENDING status - Respects settings */}
            {registration?.status === 'Pending' && showApprovalAlerts && (
                <div className="mb-4 p-4 rounded-2xl border flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/50">
                            <Clock size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Status: Pending Approval</p>
                            <p className="text-xs opacity-80">Your schedule is waiting for administrative approval.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. One-time Notification Banner for APPROVED/REJECTED status - Respects settings */}
            {bannerVisible && latestRegistration && showApprovalAlerts && (
                <div className={`mb-4 p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-top duration-500 ${
                    latestRegistration.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 text-emerald-800 dark:text-emerald-200' :
                    'bg-rose-50 dark:bg-rose-950/40 border-rose-100 text-rose-800'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            latestRegistration.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100'
                        }`}>
                            {latestRegistration.status === 'Approved' ? <Check size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold">Registration {latestRegistration.status}</p>
                            <p className="text-xs opacity-80">
                                {latestRegistration.status === 'Approved' 
                                    ? `Your schedule has been approved! ${latestRegistration.adminNote ? `Note: ${latestRegistration.adminNote}` : ''}`
                                    : `Your schedule was rejected: ${latestRegistration.adminNote || 'No reason provided.'}`}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setBannerVisible(false)}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 pl-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center">
                        <ShoppingCart size={18} className="text-[#2F80ED]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <h2 className="text-lg font-bold leading-tight">My Schedule</h2>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                            <span className="text-slate-700 dark:text-slate-200 font-semibold">{displayCourses.length} <span className="font-medium text-slate-500 dark:text-slate-400">Courses</span></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!registration && displayCourses.length > 0 && (
                        <button 
                            onClick={handleRegisterCurrent}
                            disabled={registering}
                            className="mr-2 px-6 py-2.5 rounded-xl bg-[#2F80ED] hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {registering ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                            Submit for Approval ({registrationStatus.label})
                        </button>
                    )}

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-1.5 shadow-sm">
                        <button
                            className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#2F80ED] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            onClick={() => handleSetViewMode('list')}
                        >
                            <List size={18} strokeWidth={2} />
                        </button>
                        <button
                            className={`px-4 py-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#2F80ED] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            onClick={() => handleSetViewMode('grid')}
                        >
                            <CalendarIcon size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" style={{ minHeight: 400 }}>
                {displayCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center">
                        <CalendarDays size={72} strokeWidth={1.5} className="text-[#84828f] mb-5 opacity-80" />
                        <h3 className="text-[1.35rem] font-semibold text-[#00103e] mb-2 tracking-tight">No Courses Added</h3>
                    </div>
                ) : viewMode === 'list' ? (
                    <ScheduleList courses={displayCourses} onCoursePress={setSelectedCourse} />
                ) : (
                    <div className="p-4">
                        <ScheduleGrid courses={displayCourses} onCoursePress={setSelectedCourse} />
                    </div>
                )}
            </div>

            <CourseDetailModal
                course={selectedCourse}
                visible={!!selectedCourse}
                onClose={() => setSelectedCourse(null)}
            />
        </div>
    );
}
