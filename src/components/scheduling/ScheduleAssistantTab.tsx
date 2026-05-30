import { useMemo, useState } from 'react';
import { ArrowRight, Calendar as CalendarIcon, CalendarDays, Check, Clock, Info, Loader2, Minus, Plus, RotateCcw, Search, Sparkles, Users, UserCheck, Eye, BookOpen, Library } from 'lucide-react';
import { CourseSession, DayOfWeek, RecommendationResult, SchedulePreferences } from '@/types/scheduling';
import { schedulingApi } from '@/services/schedulingApi';

const canonicalCourseKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');

const isCourseMatch = (name1: string, name2: string, strict = false) => {
    const k1 = canonicalCourseKey(name1);
    const k2 = canonicalCourseKey(name2);
    
    // Split into tokens, but keep short tokens if they are numbers or Roman numerals
    const tokens1 = k1.split(/\s+/).filter(t => t.length > 2 || /^[ivxldm0-9]+$/i.test(t));
    const tokens2 = k2.split(/\s+/).filter(t => t.length > 2 || /^[ivxldm0-9]+$/i.test(t));
    
    if (tokens1.length === 0 || tokens2.length === 0) return k1.includes(k2) || k2.includes(k1);
    
    const common = tokens1.filter(t1 => tokens2.some(t2 => t2 === t1 || t2.startsWith(t1) || t1.startsWith(t2)));
    const threshold = Math.min(tokens1.length, tokens2.length);
    
    if (strict) {
        // For badges, we want a very high match (almost all tokens)
        return common.length >= threshold;
    }
    
    return common.length >= threshold || (threshold > 1 && common.length >= threshold - 1);
};

export default function ScheduleAssistantTab({
    useMyData,
    setUseMyData,
    LEVELS,
    prefs,
    setPrefs,
    query,
    setQuery,
    instrQuery,
    setInstrQuery,
    displayCoursesByCategory,
    completedCourseBlockNames,
    advisorSelectedNames,
    setAdvisorSelectedNames,
    manualSelectedNames,
    rlRecommendedNames,
    toggleCourseName,
    displayInstructors,
    toggleInstructor,
    toggleDay,
    DAYS,
    computing,
    results,
    appliedCourses,
    appliedPrefs,
    appliedUseMyData,
    isDirty,
    handleReset,
    handleGetRecommendations,
    setPreviewBlock,
    prefsAreDefault,
    activeSemester,
    studentData,
    myRegistration,
    onRegistrationUpdate,
    setOriginalRecBlock,
    rlLoading
}: {
    useMyData: boolean | null;
    setUseMyData: React.Dispatch<React.SetStateAction<boolean | null>>;
    LEVELS: { id: 'FR' | 'JR' | 'SO' | 'SR' | 'ALL'; label: string; desc: string }[];
    prefs: SchedulePreferences;
    setPrefs: React.Dispatch<React.SetStateAction<SchedulePreferences>>;
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    instrQuery: string;
    setInstrQuery: React.Dispatch<React.SetStateAction<string>>;
    displayCoursesByCategory: Record<string, string[]>;
    completedCourseBlockNames: string[];
    advisorSelectedNames: string[];
    setAdvisorSelectedNames: React.Dispatch<React.SetStateAction<string[]>>;
    manualSelectedNames: string[];
    rlRecommendedNames: string[];
    toggleCourseName: (name: string) => void;
    displayInstructors: { doctors: string[], tas: string[] };
    toggleInstructor: (i: string) => void;
    toggleDay: (d: DayOfWeek) => void;
    DAYS: DayOfWeek[];
    computing: boolean;
    results: RecommendationResult[];
    appliedCourses: string[];
    appliedPrefs: SchedulePreferences;
    appliedUseMyData: boolean | null;
    isDirty: boolean;
    handleReset: () => void;
    handleGetRecommendations: (matchCoursesOnly?: boolean, topN?: number) => void;
    setPreviewBlock: React.Dispatch<React.SetStateAction<CourseSession[] | null>>;
    prefsAreDefault: boolean;
    activeSemester: string | null;
    studentData: any;
    myRegistration: any | null;
    onRegistrationUpdate: () => void;
    setOriginalRecBlock: (block: any) => void;
    rlLoading?: boolean;
}) {
    const [topN, setTopN] = useState<number>(5);
    const [registeringId, setRegisteringId] = useState<string | null>(null);
    const selectedCourses = useMyData ? advisorSelectedNames : manualSelectedNames;

    const handleRegister = async (rec: RecommendationResult) => {
        if (!studentData) {
            alert("Please wait for your profile to load or log in again.");
            return;
        }

        if (myRegistration && (myRegistration.status === 'Pending' || myRegistration.status === 'Approved')) {
            alert("You already have a pending or approved registration. You cannot register for another schedule.");
            return;
        }

        setOriginalRecBlock(rec.block);
        setRegisteringId(rec.block.blockId);
        const isFromRecommendation = !!useMyData;
        let isModified = false;
        if (useMyData) {
            const originalSorted = [...rlRecommendedNames].sort();
            const currentSorted = [...advisorSelectedNames].sort();
            isModified = JSON.stringify(originalSorted) !== JSON.stringify(currentSorted);
        }

        try {
            await schedulingApi.registerSchedule({
                studentId: studentData.account.id,
                studentName: studentData.account.name,
                studentEmail: studentData.account.email,
                selectedBlock: {
                    blockId: rec.block.blockId,
                    semester: rec.block.semester || activeSemester,
                    courses: rec.block.courses.map(c => ({
                        courseName: c.courseName,
                        section: c.section,
                        type: c.subtype,
                        instructor: c.instructor,
                        day: c.day,
                        startTime: c.start,
                        endTime: c.end,
                        room: c.room
                    }))
                },
                isFromRecommendation: isFromRecommendation,
                isFromRl: !!useMyData,
                isModified: isModified
            });
            alert("Schedule submitted for approval! It will appear as 'Pending' in your 'My Schedule' tab.");
            onRegistrationUpdate();
        } catch (e: any) {
            console.error(e);
            alert("Failed to submit schedule: " + e.message);
        } finally {
            setRegisteringId(null);
        }
    };

    const filteredResults = useMemo(() => {
        if (!results) return [];

        const filterKeys = appliedCourses.map(canonicalCourseKey);

        return results.filter(rec => {
            // 1. Instructor filter (We keep this as "live" filter for the search box, or we can freeze it too)
            // Let's freeze the search too for consistency with the user's request
            if (instrQuery && !rec.block.courses.some((c: CourseSession) =>
                c.instructor.toLowerCase().includes(instrQuery.toLowerCase())
            )) return false;

            // 2. Course Match Filter: Must have at least one of the selected courses
            if (appliedCourses.length > 0) {
                const hasMatch = appliedCourses.some(ac => 
                    rec.block.courses.some((c: CourseSession) => isCourseMatch(ac, c.courseName))
                );
                if (!hasMatch) return false;
            }

            return true;
        });
    }, [results, instrQuery, appliedCourses]);

    return (
        <div className="w-full">
            {/* Single-page form header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 pl-0 sm:pl-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center shrink-0">
                        <Sparkles size={18} className="text-[#2F80ED]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 text-slate-900">
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">Schedule Assistant</h2>
                            <div className="relative group flex items-center mt-0.5">
                                <Info size={15} className="text-slate-400 hover:text-blue-500 cursor-default transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white text-slate-600 text-[13px] leading-relaxed p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none font-normal">
                                    Our smart engine analyzes your preferred courses, instructor ratings, and gap constraints to find the most balanced schedule combinations automatically.
                                </div>
                            </div>
                        </div>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">Automated conflict-free scheduling based on your profile preferences.</p>
                    </div>
                </div>
            </div>


            {
                <div className="space-y-6">

                    {/* Two-column form area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">


                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full space-y-5">

                            {/* Data Source selector */}
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <label className="text-sm font-bold text-slate-700 block">Course Source</label>
                                    <div className="relative group flex items-center">
                                        <Info size={14} className="text-slate-300 hover:text-indigo-500 transition-colors" />
                                        <div className="absolute left-0 top-full mt-2 w-64 bg-white text-slate-600 text-[12px] leading-snug p-3 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none font-normal">
                                            Choose between AI-suggested courses based on your level/advisor or hand-pick from the full catalog.
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <button
                                        className={`w-full flex items-center gap-3 rounded-xl p-3.5 border-2 text-left transition-all ${useMyData === true ? 'border-[#2F80ED] bg-blue-50/40' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                        onClick={() => {
                                            setUseMyData(true);
                                            if (advisorSelectedNames.length === 0 && rlRecommendedNames.length > 0) {
                                                setAdvisorSelectedNames([...rlRecommendedNames]);
                                            }
                                        }}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <UserCheck size={18} className="text-[#2F80ED]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">Sync with My Advisor</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Auto-fill courses based on your recent advisor discussion</p>
                                        </div>
                                        {useMyData === true && <div className="w-5 h-5 rounded-full bg-[#2F80ED] flex items-center justify-center flex-shrink-0"><Check size={11} className="text-white" /></div>}
                                    </button>
                                    <button
                                        className={`w-full flex items-center gap-3 rounded-xl p-3.5 border-2 text-left transition-all ${useMyData === false ? 'border-[#2F80ED] bg-blue-50/40' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                        onClick={() => setUseMyData(false)}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Search size={18} className="text-[#2F80ED]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">Browse Catalog</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Pick specific courses from the full semester list</p>
                                        </div>
                                        {useMyData === false && <div className="w-5 h-5 rounded-full bg-[#2F80ED] flex items-center justify-center flex-shrink-0"><Check size={11} className="text-white" /></div>}
                                    </button>
                                </div>
                            </div>

                            {/* Level picker â€“ only for manual */}
                            {useMyData === false && (
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2.5">Academic Level</label>
                                    <div className="flex flex-wrap gap-2">
                                        {LEVELS.map(l => {
                                            const on = prefs.level === l.id;
                                            return (
                                                <button
                                                    key={l.id}
                                                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                                    onClick={() => setPrefs(p => ({ ...p, level: l.id }))}
                                                >
                                                    {l.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Course selection */}
                            {useMyData !== null && (
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="text-sm font-bold text-slate-700">
                                            {useMyData ? 'Eligible Courses' : 'Browse Courses'}
                                        </label>
                                        {useMyData ? (
                                            advisorSelectedNames.length > 0 && <span className="text-xs font-semibold text-[#2F80ED]">{advisorSelectedNames.length} selected</span>
                                        ) : (
                                            manualSelectedNames.length > 0 && <span className="text-xs font-semibold text-[#2F80ED]">{manualSelectedNames.length} selected</span>
                                        )}
                                    </div>

                                    {/* Hide Completed Toggle */}
                                    <div className="mb-4">
                                        <button
                                            onClick={() => setPrefs(p => ({ ...p, hideCompleted: !p.hideCompleted }))}
                                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${prefs.hideCompleted ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prefs.hideCompleted ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Library size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-bold text-slate-700 leading-none">Hide Completed</p>
                                                    <p className="text-[9px] text-slate-400 mt-0.5">Filter out courses you already passed</p>
                                                </div>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${prefs.hideCompleted ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${prefs.hideCompleted ? 'left-6' : 'left-1'}`} />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 mb-3 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                        <Search size={14} className="text-slate-400" />
                                        <input
                                            type="text"
                                            className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                                            placeholder="Search courses"
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                        />
                                        {query && <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 text-xs"></button>}
                                    </div>

                                    <div className={`${useMyData ? 'flex-1' : 'max-h-[310px]'} overflow-y-auto pr-1 scrollbar-hide space-y-3`}>
                                        {rlLoading && useMyData && rlRecommendedNames.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                                <Loader2 size={24} className="animate-spin mb-2" />
                                                <p className="text-xs font-medium">Fetching advisor recommendations...</p>
                                            </div>
                                        )}
                                        
                                        {!rlLoading && useMyData && rlRecommendedNames.length === 0 && (
                                            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                <p className="text-xs font-bold text-slate-500 mb-1">No Advisor Recommendations Found</p>
                                                <p className="text-[10px] text-slate-400">Try switching to 'Browse Catalog' to pick courses manually.</p>
                                            </div>
                                        )}

                                        {Object.entries(displayCoursesByCategory).map(([category, names]) => (
                                            <div key={category}>
                                                <div className="flex items-center justify-between mb-1.5 mt-2 first:mt-0">
                                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{category}</h3>
                                                    {category === 'Recommended for You' && (
                                                        <button
                                                            onClick={() => {
                                                                const allSelected = names.every((n: string) => advisorSelectedNames.includes(n));
                                                                if (allSelected) {
                                                                    setAdvisorSelectedNames(prev => prev.filter(x => !names.includes(x)));
                                                                } else {
                                                                    setAdvisorSelectedNames(prev => [...new Set([...prev, ...names])]);
                                                                }
                                                            }}
                                                            className="text-[10px] font-extrabold text-[#2F80ED] hover:text-blue-700 transition-colors"
                                                        >
                                                            {names.every((n: string) => advisorSelectedNames.includes(n)) ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5">
                                                    {names.map((name: string) => {
                                                        const isSelected = useMyData ? advisorSelectedNames.includes(name) : manualSelectedNames.includes(name);
                                                        const isRecommended = rlRecommendedNames.some(rn => isCourseMatch(rn, name, true));
                                                        return (
                                                            <button
                                                                key={name}
                                                                className={`w-full flex items-center gap-2.5 rounded-xl p-2.5 border text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                                onClick={() => toggleCourseName(name)}
                                                            >
                                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'border-[#2F80ED] bg-[#2F80ED]' : 'border-slate-300'}`}>
                                                                    {isSelected && <Check size={10} className="text-white" />}
                                                                </div>
                                                                <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{name}</span>
                                                                {isRecommended && (
                                                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                                                        Suggested ✧
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(displayCoursesByCategory).length === 0 && (!useMyData || rlRecommendedNames.length > 0) && (
                                            <p className="text-center text-sm text-slate-400 py-8">No courses match your search.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>


                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full space-y-5">

                            {/* Instructors */}
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <Users size={14} className="text-[#2F80ED]" />
                                    <label className="text-sm font-bold text-slate-700">Preferred Instructors</label>
                                    {prefs.preferredInstructors.length > 0 && <span className="text-xs font-semibold text-[#2F80ED] ml-auto">{prefs.preferredInstructors.length} selected</span>}
                                </div>
                                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 mb-3 focus-within:border-blue-300 transition-all">
                                    <Search size={13} className="text-slate-400" />
                                    <input type="text" className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-400" placeholder="Search instructors" value={instrQuery} onChange={e => setInstrQuery(e.target.value)} />
                                    {instrQuery && <button onClick={() => setInstrQuery('')} className="text-slate-400 text-xs"></button>}
                                </div>
                                {displayInstructors.doctors.length === 0 && displayInstructors.tas.length === 0 ? (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-[11px] font-bold text-slate-400">Select courses first to view their instructors.</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[160px] overflow-auto scrollbar-hide">
                                        {displayInstructors.doctors.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Doctors
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {displayInstructors.doctors.map((instr: string) => {
                                                        const on = prefs.preferredInstructors.includes(instr);
                                                        return (
                                                            <button key={instr} className={`px-2.5 py-1 rounded-xl border text-xs font-medium transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`} onClick={() => toggleInstructor(instr)}>
                                                                {instr}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {displayInstructors.tas.length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Teaching Assistants
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {displayInstructors.tas.map((instr: string) => {
                                                        const on = prefs.preferredInstructors.includes(instr);
                                                        return (
                                                            <button key={instr} className={`px-2.5 py-1 rounded-xl border text-xs font-medium transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`} onClick={() => toggleInstructor(instr)}>
                                                                {instr}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Campus Days */}
                            <div>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <CalendarDays size={14} className="text-[#2F80ED]" />
                                    <label className="text-sm font-bold text-slate-700">Campus Days</label>
                                    <div className="relative group flex items-center">
                                        <Info size={13} className="text-slate-300 hover:text-blue-500 transition-colors" />
                                        <div className="absolute left-0 top-full mt-2 w-60 bg-white text-slate-600 text-[12px] leading-snug p-3 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none font-normal">
                                            Total days you prefer to be on campus.
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    {(['count', 'specific'] as const).map(mode => {
                                        const on = prefs.dayMode === mode;
                                        return (
                                            <button key={mode} className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`} onClick={() => setPrefs(p => ({ ...p, dayMode: mode }))}>
                                                {mode === 'count' ? '# of Days' : 'Specific Days'}
                                            </button>
                                        );
                                    })}
                                </div>
                                {prefs.dayMode === 'count' ? (
                                    <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 p-1 rounded-2xl w-64 mx-auto px-2">
                                        <button
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-[#2F80ED] hover:border-blue-200 transition-all shadow-sm active:scale-95"
                                            onClick={() => setPrefs(p => ({ ...p, numPreferredDays: Math.max(1, (p.numPreferredDays ?? 3) - 1) }))}
                                        >
                                            <Minus size={14} strokeWidth={3} />
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <span className="text-base font-bold text-slate-800 leading-none">{prefs.numPreferredDays ?? 3}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Days</span>
                                        </div>
                                        <button
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-[#2F80ED] hover:border-blue-200 transition-all shadow-sm active:scale-95"
                                            onClick={() => setPrefs(p => ({ ...p, numPreferredDays: Math.min(6, (p.numPreferredDays ?? 3) + 1) }))}
                                        >
                                            <Plus size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-1.5">
                                        {DAYS.map(d => {
                                            const on = prefs.preferredDays.includes(d);
                                            return (
                                                <button key={d} className={`px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`} onClick={() => toggleDay(d)}>
                                                    {d.slice(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Hard Limits */}
                            <div className="space-y-6">
                                <div className="flex flex-col">
                                    <label className="text-sm font-bold text-slate-700 block mb-3 flex items-center gap-2">
                                        <CalendarIcon size={14} className="text-[#2F80ED]" />
                                        Max Days <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-100 uppercase tracking-wide">Hard Limit</span>
                                        <div className="relative group flex items-center">
                                            <Info size={13} className="text-slate-300 hover:text-blue-500 transition-colors" />
                                            <div className="absolute left-0 top-full mt-2 w-60 bg-white text-slate-600 text-[12px] leading-snug p-3 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none font-normal">
                                                Strict limit on the number of days per week.
                                            </div>
                                        </div>
                                    </label>
                                    <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 p-1 rounded-2xl w-64 mx-auto px-2">
                                        <button
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                            onClick={() => setPrefs(p => ({ ...p, maxDaysPerWeek: Math.max(1, p.maxDaysPerWeek - 1) }))}
                                        >
                                            <Minus size={14} strokeWidth={3} />
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <span className="text-base font-bold text-slate-800 leading-none">{prefs.maxDaysPerWeek}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Days/Week</span>
                                        </div>
                                        <button
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                            onClick={() => setPrefs(p => ({ ...p, maxDaysPerWeek: Math.min(6, p.maxDaysPerWeek + 1) }))}
                                        >
                                            <Plus size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={14} className="text-[#2F80ED]" />
                                        <label className="text-sm font-bold text-slate-700">Max Gap <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-md border border-red-100 uppercase tracking-wide ml-1">Hard Limit</span></label>
                                        <div className="relative group flex items-center">
                                            <Info size={13} className="text-slate-300 hover:text-blue-500 transition-colors" />
                                            <div className="absolute left-0 top-full mt-2 w-60 bg-white text-slate-600 text-[12px] leading-snug p-3 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none font-normal">
                                                Strict limit on idle hours between classes.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 p-1 rounded-2xl w-64 mx-auto px-2">
                                        <button
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                            onClick={() => setPrefs(p => ({ ...p, maxGapHours: Math.max(0, Math.round((p.maxGapHours - 0.5) * 10) / 10) }))}
                                        >
                                            <Minus size={14} strokeWidth={3} />
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <span className="text-base font-bold text-slate-800 leading-none">{prefs.maxGapHours === 0 ? 'None' : `${prefs.maxGapHours}h`}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{prefs.maxGapHours === 0 ? 'No Limit' : 'Max Gap'}</span>
                                        </div>
                                        <button
                                            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                                            onClick={() => setPrefs(p => ({ ...p, maxGapHours: Math.min(8, Math.round((p.maxGapHours + 0.5) * 10) / 10) }))}
                                        >
                                            <Plus size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Time Range */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={14} className="text-[#2F80ED]" />
                                    <label className="text-sm font-bold text-slate-700">Preferred Time Range</label>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Earliest Start</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all"
                                                value={prefs.earliestTime}
                                                onChange={e => setPrefs(p => ({ ...p, earliestTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="pt-5 text-slate-300">
                                            <ArrowRight size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Latest End</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all"
                                                value={prefs.latestTime}
                                                onChange={e => setPrefs(p => ({ ...p, latestTime: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end w-full">
                        <button
                            className={`flex items-center justify-center gap-2.5 py-3 px-8 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 w-full sm:w-auto ${computing || useMyData === null || (useMyData ? advisorSelectedNames.length === 0 : manualSelectedNames.length === 0)
                                ? 'bg-slate-300 cursor-not-allowed opacity-70'
                                : results.length > 0 && !isDirty
                                    ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-200/50'
                                    : 'bg-[#2F80ED] hover:bg-blue-600 shadow-blue-200/50'}`}
                            disabled={computing || useMyData === null || (useMyData ? advisorSelectedNames.length === 0 : manualSelectedNames.length === 0)}
                            onClick={results.length > 0 && !isDirty ? handleReset : () => handleGetRecommendations(false, topN)}
                        >
                            {computing ? (
                                <><Loader2 size={16} className="animate-spin" /> Computing…</>
                            ) : results.length > 0 && !isDirty ? (
                                <><RotateCcw size={16} /> Reset Assistant</>
                            ) : isDirty ? (
                                <><Sparkles size={16} /> Update Recommendations</>
                            ) : (
                                <><Sparkles size={16} /> Get Recommendations</>
                            )}
                        </button>
                    </div>


                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-500" style={{ minHeight: 440 }}>
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 bg-slate-50/40">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center">
                                    <Sparkles size={18} className="text-[#2F80ED]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-slate-900 leading-tight">Recommended Blocks</h3>
                                        <div className="relative group flex items-center mt-0.5">
                                            <Info size={14} className="text-slate-300 hover:text-blue-500 transition-colors" />
                                            <div className="absolute left-0 top-full mt-2 w-64 bg-white text-slate-600 text-[12px] leading-snug p-3 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none font-normal">
                                                These blocks are calculated based on your course priorities and scheduling constraints.
                                            </div>
                                        </div>
                                    </div>
                                    {!computing && results.length > 0 ? (
                                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500">
                                            <span>{filteredResults.length} match{filteredResults.length !== 1 ? 'es' : ''} found</span>
                                            {activeSemester && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-blue-500 font-bold">{activeSemester}</span>
                                                </>
                                            )}
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[#2F80ED] font-bold">Best {filteredResults[0]?.matchScore}% Match</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500">
                                            <span>{computing ? 'AI is analyzing preferences...' : 'Results will appear here'}</span>
                                            {activeSemester && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-blue-500 font-bold">{activeSemester}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-5">
                            {computing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="bg-white rounded-2xl border border-slate-50 p-5 animate-pulse">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                                                    <div className="h-2.5 bg-slate-50 rounded w-3/4" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[0, 1, 2].map(j => <div key={j} className="h-10 bg-slate-50 rounded-xl" />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : results.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[340px] text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-blue-100/30 blur-2xl rounded-full" />
                                        <Search size={72} strokeWidth={1.5} className="text-[#84828f] relative opacity-70" />
                                        <div className="absolute -top-1 -right-1">
                                            <Sparkles size={24} className="text-blue-400 animate-pulse" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#00103e] mb-2">No Recommendations Yet</h3>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {filteredResults.length === 0 ? (
                                        <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                                            <Search size={48} strokeWidth={1.5} className="text-slate-300 mb-4" />
                                            <h4 className="text-base font-bold text-slate-600 mb-1">No blocks found for your selected courses</h4>
                                            <p className="text-[12px] text-slate-400 font-medium">Try selecting different courses or adjusting preferences.</p>
                                        </div>
                                    ) : (
                                        filteredResults.map((rec, idx) => {
                                            const uniqueDaysList = Array.from(new Set(rec.block.courses.map((c: CourseSession) => c.day))) as DayOfWeek[];
                                            const blockCourseNames = rec.block.courses.map((c: CourseSession) => c.courseName);
                                            const filterKeys = appliedCourses.map(canonicalCourseKey);
                                            const blockKeys = blockCourseNames.map(canonicalCourseKey);
                                            const matchedCount = appliedCourses.filter(ac => 
                                                blockCourseNames.some(bcn => isCourseMatch(ac, bcn))
                                            ).length;

                                            // Calculate if the 'applied' preferences were default
                                            const appliedPrefsAreDefault =
                                                appliedPrefs.preferredDays.length === 0 &&
                                                appliedPrefs.preferredInstructors.length === 0 &&
                                                appliedPrefs.scheduleType === 'balanced'; // Simple check for brevity

                                            const displayScore = appliedPrefsAreDefault && filterKeys.length > 0
                                                ? Math.round((matchedCount / filterKeys.length) * 100)
                                                : rec.matchScore;

                                            // Generate combined AI Insight from actual reasons
                                            const aiInsight = rec.reasons && rec.reasons.length > 0
                                                ? rec.reasons.join(". ")
                                                : "Balanced arrangement of courses with efficient gaps.";

                                            return (
                                                <div key={`${rec.block.blockId}-${rec.block.semester}`} className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-sm transition-all duration-300">
                                                    <div className="relative z-10 flex flex-col gap-3.5">
                                                        {/* Header: All stats in one line */}
                                                        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex flex-col items-center justify-center min-w-[40px] h-10 rounded-lg bg-blue-50/50 border border-blue-100/30">
                                                                    <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">Rank</span>
                                                                    <span className="text-sm font-black text-blue-500 leading-none">#{idx + 1}</span>
                                                                </div>
                                                                <div className="w-[1px] h-6 bg-slate-200" />
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-slate-800 leading-none mb-1">{rec.block.blockId}</h4>
                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                                                        <span>{rec.block.totalCredits} Credits</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                        <span>{uniqueDaysList.length} Days</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Match</p>
                                                                <p className="text-2xl font-black text-blue-500 leading-none">{displayScore}%</p>
                                                            </div>
                                                        </div>

                                                        {/* Courses Section - More Compact */}
                                                        <div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {Array.from(new Set(rec.block.courses.map((c: CourseSession) => c.courseName)))
                                                                    .map((courseName: string) => {
                                                                        const isMatched = appliedCourses.some(ac => isCourseMatch(ac, courseName));
                                                                        const isCompleted = prefs.hideCompleted && completedCourseBlockNames.some(cn => canonicalCourseKey(cn) === canonicalCourseKey(courseName));
                                                                        return (
                                                                            <div
                                                                                key={courseName}
                                                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${isCompleted
                                                                                    ? 'bg-red-50/50 border-red-100 text-red-400 opacity-80'
                                                                                    : isMatched
                                                                                        ? 'bg-blue-50/50 border-blue-100 text-blue-500'
                                                                                        : 'bg-slate-50 border-slate-200 text-slate-500'
                                                                                    }`}
                                                                            >
                                                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCompleted ? 'bg-red-300' : isMatched ? 'bg-blue-400' : 'bg-slate-300'}`} />
                                                                                <span className={isCompleted ? 'line-through' : ''}>{courseName}</span>
                                                                                {isCompleted && (
                                                                                    <span className="text-[8px] uppercase tracking-wider font-black text-red-300 ml-1 shrink-0">HIDDEN</span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* AI Analysis - Dynamic & Contextual */}
                                                        <div className="bg-blue-50/30 rounded-xl p-2.5 flex items-center gap-2.5 border border-blue-100/20">
                                                            <Sparkles size={14} className="text-blue-400 shrink-0" />
                                                            <p className="text-[11px] text-slate-600 font-medium leading-tight">
                                                                <span className="font-bold text-blue-500">Covers {matchedCount}/{filterKeys.length} courses.</span> {aiInsight}
                                                            </p>
                                                        </div>

                                                        {/* Bottom Row: Days and Button on same line */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                                                            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
                                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'].map((d: any) => {
                                                                    const isActive = uniqueDaysList.includes(d);
                                                                    return (
                                                                        <div
                                                                            key={d}
                                                                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all border shrink-0 ${isActive
                                                                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                                : 'bg-white text-slate-200 border-slate-100'
                                                                                }`}
                                                                        >
                                                                            {d.charAt(0)}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                                <button
                                                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all shadow-sm"
                                                                    onClick={() => setPreviewBlock(rec.block.courses)}
                                                                >
                                                                    <Eye size={13} strokeWidth={2.5} />
                                                                    Preview
                                                                </button>
                                                                <button
                                                                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-[11px] font-bold transition-all shadow-md ${
                                                                        registeringId === rec.block.blockId ? 'bg-blue-300' : 
                                                                        (myRegistration?.status === 'Pending' || myRegistration?.status === 'Approved') ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                                                                        'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
                                                                    }`}
                                                                    onClick={() => handleRegister(rec)}
                                                                    disabled={registeringId !== null || myRegistration?.status === 'Pending' || myRegistration?.status === 'Approved'}
                                                                >
                                                                    {registeringId === rec.block.blockId ? (
                                                                        <Loader2 size={13} className="animate-spin" />
                                                                    ) : (myRegistration?.status === 'Pending' || myRegistration?.status === 'Approved') ? (
                                                                        <Check size={13} strokeWidth={2.5} />
                                                                    ) : (
                                                                        <Plus size={13} strokeWidth={2.5} />
                                                                    )}
                                                                    {(myRegistration?.status === 'Pending' || myRegistration?.status === 'Approved') ? 'Registered' : 'Add to My Schedule'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                </div>

                            )}

                            {/* Top N Selector */}
                            {!computing && results.length > 0 && (
                                <div className="mt-6 flex justify-end">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                                        {[5, 10, 20].map(val => {
                                            const isActive = topN === val;
                                            return (
                                                <button
                                                    key={val}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive
                                                        ? 'bg-white text-[#2F80ED] shadow-sm border border-slate-200'
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
                                                        }`}
                                                    onClick={() => {
                                                        setTopN(val);
                                                        // Automatically fetch new recommendations with the new topN if we already have results
                                                        if (results.length > 0 && !isDirty) {
                                                            handleGetRecommendations(false, val);
                                                        }
                                                    }}
                                                >
                                                    Top {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

