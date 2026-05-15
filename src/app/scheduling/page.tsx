'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CalendarDays, Layers, Sparkles, List, Calendar as CalendarIcon,
    ShoppingCart, Search, Check, ChevronLeft, ChevronRight,
    Eye, Database, BookOpen, Users, Clock, Loader2, Info, UserCheck, Compass, Library,
    Minus, Plus, ArrowRight, RotateCcw
} from 'lucide-react';
import { getToken, parseJwt, removeToken } from '@/lib/auth';
import { MY_SCHEDULE_COURSES } from '@/data/schedulingData';
import { Block, CourseSession, DayOfWeek, SchedulePreferences, RecommendationResult } from '@/types/scheduling';
import { schedulingApi } from '@/services/schedulingApi';
import { getEligibleCoursesForStudent, getStudentLevel } from '@/utils/eligibilityEngine';
import { GENERAL_TRACK_COMPLETE } from '@/data/general-track-complete';
import { BIGDATA_TRACK_COMPLETE } from '@/data/bigdata-track-complete';
import { MEDIA_TRACK_COMPLETE } from '@/data/media-track-complete';
import SchedulingHeader from '@/components/scheduling/SchedulingHeader';
import MyScheduleTab from '@/components/scheduling/MyScheduleTab';
import BlocksExplorerTab from '@/components/scheduling/BlocksExplorerTab';
import ScheduleAssistantTab from '@/components/scheduling/ScheduleAssistantTab';
import SchedulePreviewModal from '@/components/scheduling/SchedulePreviewModal';

// Removed frontend mapping logic to rely on backend mapping

type Tab = 'my-schedule' | 'blocks-explorer' | 'assistant';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
    { id: 'my-schedule', label: 'My Schedule', icon: CalendarDays },
    { id: 'assistant', label: 'Schedule Assistant', icon: Sparkles },
    { id: 'blocks-explorer', label: 'Blocks Explorer', icon: Layers },
];

const DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];
const LEVELS: { id: 'FR' | 'JR' | 'SO' | 'SR' | 'ALL'; label: string; desc: string }[] = [
    { id: 'FR', label: 'Freshman', desc: 'Level 1 (1st year)' },
    { id: 'SO', label: 'Sophomore', desc: 'Level 2 (2nd year)' },
    { id: 'JR', label: 'Junior', desc: 'Level 3 (3rd year)' },
    { id: 'SR', label: 'Senior', desc: 'Level 4 (4th year)' },
    { id: 'ALL', label: 'All Levels', desc: 'Search all block levels' },
];

const DEFAULT_PREFS: SchedulePreferences = {
    level: 'ALL',
    preferredDays: [],
    numPreferredDays: undefined,
    dayMode: 'count',
    maxDaysPerWeek: 6,
    maxGapHours: 6,
    earliestTime: '08:30',
    latestTime: '18:30',
    preferredInstructors: [],
    scheduleType: 'balanced',
    hideCompleted: true,
};

export function SchedulingPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get tab from URL or default to 'my-schedule'
    const currentTab = (searchParams.get('tab') as Tab) || 'my-schedule';
    const [activeTab, setActiveTab] = useState<Tab>(currentTab);

    // Sync with URL changes (e.g. browser back button)
    useEffect(() => {
        const tab = searchParams.get('tab') as Tab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);

        // Prevent "No blocks found" flash when switching to blocks tab
        if (tab === 'blocks-explorer' && availableBlocks.length === 0 && !hasAttemptedFetch) {
            setBlocksLoading(true);
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    // Ensure URL has tab param on initial load
    useEffect(() => {
        if (!searchParams.get('tab')) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', 'my-schedule');
            window.history.replaceState(null, '', `?${params.toString()}`);
        }
    }, [searchParams]);

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const [blocksLoading, setBlocksLoading] = useState(currentTab === 'blocks-explorer' && availableBlocks.length === 0);
    const [blockQuery, setBlockQuery] = useState('');
    const [blockLevelTab, setBlockLevelTab] = useState<'FR' | 'JR' | 'SO' | 'SR' | 'ALL'>('ALL');
    const [blockCurrentPage, setBlockCurrentPage] = useState(1);
    const [activeSemester, setActiveSemester] = useState<string | null>(null);
    const BLOCKS_PER_PAGE = 9;

    const filteredBlocks = useMemo(() => {
        const q = blockQuery.toLowerCase().trim();
        let list = availableBlocks;

        // 1. Filter by Level Tab
        if (blockLevelTab !== 'ALL') {
            list = list.filter(b => {
                const id = b.blockId.toUpperCase();
                const pattern = new RegExp(`(^|[-_ ])${blockLevelTab}([-_ ]|$)`);
                return pattern.test(id);
            });
        }

        // 2. Filter by Search Query
        if (!q) return list;
        return list.filter((b: Block) =>
            b.blockId.toLowerCase().includes(q) ||
            b.courses.some((c: CourseSession) => c.courseName.toLowerCase().includes(q))
        );
    }, [blockQuery, availableBlocks, blockLevelTab]);

    const paginatedBlocks = useMemo(() => {
        const start = (blockCurrentPage - 1) * BLOCKS_PER_PAGE;
        return filteredBlocks.slice(start, start + BLOCKS_PER_PAGE);
    }, [filteredBlocks, blockCurrentPage]);

    const totalBlockPages = Math.ceil(filteredBlocks.length / BLOCKS_PER_PAGE);

    // Reset pagination on filter change
    useEffect(() => {
        setBlockCurrentPage(1);
    }, [blockLevelTab, blockQuery]);


    const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
    const [useMyData, setUseMyData] = useState<boolean | null>(null);
    const [query, setQuery] = useState('');
    const [instrQuery, setInstrQuery] = useState('');
    const [manualSelectedNames, setManualSelectedNames] = useState<string[]>([]);
    const [advisorSelectedNames, setAdvisorSelectedNames] = useState<string[]>([]);
    const [prefs, setPrefs] = useState<SchedulePreferences>(DEFAULT_PREFS);
    const [results, setResults] = useState<RecommendationResult[]>([]);
    const [categorizedInstructors, setCategorizedInstructors] = useState<{ doctors: string[], tas: string[] }>({ doctors: [], tas: [] });
    const [computing, setComputing] = useState(false);
    const [previewBlock, setPreviewBlock] = useState<CourseSession[] | null>(null);
    const [previewCourse, setPreviewCourse] = useState<CourseSession | null>(null);
    const [rlRecommendedNames, setRlRecommendedNames] = useState<string[]>([]);
    const [rlLoading, setRlLoading] = useState(false);
    const [allCourseNames, setAllCourseNames] = useState<string[]>([]);
    const [allInstructors, setAllInstructors] = useState<string[]>([]);
    const [studentData, setStudentData] = useState<any>(null);
    const [myRegistration, setMyRegistration] = useState<any | null>(null);
    const [latestRegistration, setLatestRegistration] = useState<any | null>(null);
    const [originalRecBlock, setOriginalRecBlock] = useState<any | null>(null);
    const [regsLoading, setRegsLoading] = useState(false);
    const [lastConfig, setLastConfig] = useState<string | null>(null);
    const [appliedCourses, setAppliedCourses] = useState<string[]>([]);
    const [appliedPrefs, setAppliedPrefs] = useState<SchedulePreferences>(DEFAULT_PREFS);
    const [appliedUseMyData, setAppliedUseMyData] = useState<boolean | null>(null);
    const [courseMappings, setCourseMappings] = useState<any[]>([]);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        try {
            const raw = localStorage.getItem('nupal_student_settings');
            if (raw) {
                const s = JSON.parse(raw);
                return s.autoSaveDrafts !== false;
            }
        } catch {}
        return true;
    });
    const [hasRestored, setHasRestored] = useState(false);

    // Sync settings from localStorage
    const syncSettings = useCallback(() => {
        try {
            const raw = localStorage.getItem('nupal_student_settings');
            if (raw) {
                const s = JSON.parse(raw);
                const enabled = s.autoSaveDrafts !== false;
                setAutoSaveEnabled(enabled);
                
                // If user just turned it off, clear the current draft so it doesn't 
                // re-appear if they turn it back on later with stale data
                if (!enabled) {
                    localStorage.removeItem('nupal_scheduling_draft');
                }
            }
        } catch {}
    }, []);

    useEffect(() => {
        syncSettings();
        
        // Sync when switching back to this tab or when storage changes in another tab
        window.addEventListener('focus', syncSettings);
        window.addEventListener('storage', syncSettings);
        // Custom event for same-window sync from modal
        window.addEventListener('nupal-settings-updated', syncSettings);
        
        return () => {
            window.removeEventListener('focus', syncSettings);
            window.removeEventListener('storage', syncSettings);
            window.removeEventListener('nupal-settings-updated', syncSettings);
        };
    }, [syncSettings]);

    // Load Draft on Mount
    useEffect(() => {
        if (!autoSaveEnabled || hasRestored) return;
        try {
            const draftRaw = localStorage.getItem('nupal_scheduling_draft');
            if (draftRaw) {
                const draft = JSON.parse(draftRaw);
                if (draft.manualSelectedNames) setManualSelectedNames(draft.manualSelectedNames);
                if (draft.advisorSelectedNames) setAdvisorSelectedNames(draft.advisorSelectedNames);
                if (draft.prefs) setPrefs(prev => ({ ...prev, ...draft.prefs }));
                if (draft.useMyData !== undefined) setUseMyData(draft.useMyData);
                console.log('[Draft] Restored scheduling progress');
            }
        } catch (e) {
            console.warn('Failed to load scheduling draft:', e);
        } finally {
            setHasRestored(true);
        }
    }, [autoSaveEnabled, hasRestored]);

    // Save Draft on Change
    useEffect(() => {
        // Only save if auto-save is enabled AND we've already finished restoring the previous draft
        // This prevents overwriting the draft with empty state on initial mount
        if (!autoSaveEnabled || !hasRestored) return;
        
        const draft = {
            manualSelectedNames,
            advisorSelectedNames,
            prefs,
            useMyData,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('nupal_scheduling_draft', JSON.stringify(draft));
    }, [manualSelectedNames, advisorSelectedNames, prefs, useMyData, autoSaveEnabled, hasRestored]);

    const isDirty = useMemo(() => {
        if (!results.length || !lastConfig) return false;
        const current = JSON.stringify({ prefs, manualSelectedNames, advisorSelectedNames, useMyData });
        return lastConfig !== current;
    }, [results.length, lastConfig, prefs, manualSelectedNames, advisorSelectedNames, useMyData]);

    // Prevent showing stale results when switching between Sync and Browse modes
    useEffect(() => {
        if (useMyData !== null) {
            setResults([]);
            setAppliedCourses([]);
        }
    }, [useMyData]);

    const prefsAreDefault = useMemo(
        () =>
            prefs.preferredDays.length === 0 &&
            prefs.numPreferredDays === DEFAULT_PREFS.numPreferredDays &&
            prefs.maxDaysPerWeek === DEFAULT_PREFS.maxDaysPerWeek &&
            prefs.maxGapHours === DEFAULT_PREFS.maxGapHours &&
            prefs.earliestTime === DEFAULT_PREFS.earliestTime &&
            prefs.latestTime === DEFAULT_PREFS.latestTime &&
            prefs.preferredInstructors.length === 0 &&
            prefs.scheduleType === DEFAULT_PREFS.scheduleType,
        [prefs]
    );

    // Note: results filtering is handled inside the ScheduleAssistantTab UI.

    // Load Student Profile & RL Recommendation
    const initializeData = useCallback(async () => {
        try {
            // Fetch course mappings first
            let mappings: any[] = [];
            try {
                mappings = await schedulingApi.getCourseMappings();
                setCourseMappings(mappings);
            } catch (e) {
                console.warn('Failed to load course mappings:', e);
            }

            const token = getToken();
            if (!token) return;
            const user = parseJwt(token);
            if (!user || !user.email) return;
            const { getStudentByEmail } = await import('@/services/studentService');
            const data = await getStudentByEmail(user.email);

            if (data) {
                setStudentData(data);
                
                // Fetch registration
                setRegsLoading(true);
                try {
                    const [reg, latest] = await Promise.all([
                        schedulingApi.getMyRegistration(),
                        schedulingApi.getLatestRegistration()
                    ]);
                    setMyRegistration(reg);
                    setLatestRegistration(latest);
                } catch (e) {
                    console.error("Error loading registration:", e);
                } finally {
                    setRegsLoading(false);
                }

                // Fetch RL recommendation
                setRlLoading(true);
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
                    const url = `${baseUrl}/api/students/${data.account.id}/rl-recommendation`;
                    console.log('[DEBUG] Fetching RL Recommendation from:', url);

                    const res = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const rlRaw = await res.json();
                        console.log('[DEBUG] RL Data Fetched:', rlRaw);

                        if (rlRaw && rlRaw.courses && Array.isArray(rlRaw.courses)) {
                            const recommendedList = Array.from(new Set(rlRaw.courses.map((c: any) => typeof c === 'string' ? c : c.id || c.name || c.courseId)));

                            setRlRecommendedNames(recommendedList as string[]);
                            
                            // Only overwrite advisorSelectedNames if we haven't already restored a custom draft
                            // OR if the current list is empty
                            setAdvisorSelectedNames(prev => {
                                if (prev && prev.length > 0) return prev;
                                return recommendedList as string[];
                            });
                        } else {
                            setRlRecommendedNames([]);
                            setAdvisorSelectedNames([]);
                        }
                    } else {
                        console.warn('[DEBUG] RL Fetch response not OK:', res.status, await res.text());
                    }
                } catch (e) {
                    console.error('[DEBUG] RL Fetch Exception:', e);
                } finally {
                    setRlLoading(false);
                }
            }
        } catch (err) {
            console.error('Failed to initialize scheduling data:', err);
        }
    }, [activeSemester]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);



    // Smart Polling: Sync active semester with admin changes
    useEffect(() => {
        const checkSemester = async () => {
            // Only poll if the tab is visible to save resources
            if (document.visibilityState !== 'visible') return;

            try {
                const latest = await schedulingApi.getActiveSemester();
                setActiveSemester(prev => {
                    if (prev && prev !== latest) {
                        setAvailableBlocks([]);
                        setHasAttemptedFetch(false);
                    }
                    return latest;
                });
            } catch (e) { /* Silent fail */ }
        };

        // 1. Regular interval (20s)
        const timer = setInterval(checkSemester, 20000);

        // 2. Immediate check when student switches back to this tab
        window.addEventListener('focus', checkSemester);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', checkSemester);
        };
    }, []);

    // Load blocks when Blocks Explorer tab is opened or active semester changes
    useEffect(() => {
        const shouldFetch = (activeTab === 'blocks-explorer' && availableBlocks.length === 0 && !hasAttemptedFetch) ||
            (activeSemester && hasAttemptedFetch && availableBlocks.length === 0);

        if (shouldFetch) {
            setBlocksLoading(true);
            setHasAttemptedFetch(true);

            // Parallel fetch blocks and active semester
            Promise.all([
                schedulingApi.getBlocks(),
                schedulingApi.getActiveSemester()
            ])
                .then(([blocks, semester]) => {
                    setAvailableBlocks(blocks);
                    setActiveSemester(semester);
                })
                .catch(e => console.warn('Failed to load blocks or semester:', e))
                .finally(() => setBlocksLoading(false));
        } else if (!activeSemester) {
            // Just fetch semester if not already fetched
            schedulingApi.getActiveSemester()
                .then(setActiveSemester)
                .catch(e => console.warn('Failed to fetch active semester:', e));
        }
    }, [activeTab, activeSemester, hasAttemptedFetch]);

    // Reload course names, instructors & blocks when level or active semester changes
    useEffect(() => {
        const lvl = prefs.level || undefined;
        Promise.all([
            schedulingApi.getCourseNames(lvl),
            schedulingApi.getInstructors(lvl),
            schedulingApi.getBlocks(lvl)
        ])
            .then(([names, instructors, blocks]) => {
                setAllCourseNames(names);
                setAllInstructors(Array.from(new Set(instructors)));
                setAvailableBlocks(blocks);
            })
            .catch(e => console.warn('Failed to load course metadata:', e));
    }, [prefs.level, activeSemester]);

    useEffect(() => {
        if (useMyData) {
            setPrefs(p => ({ ...p, level: 'ALL' }));
        }
    }, [useMyData]);

    const eligibleCourses = useMemo(() => {
        if (!studentData?.education?.semesters) return [];
        const passedCourses = studentData.education.semesters.flatMap((s: any) => s.courses);
        const mapped = passedCourses.map((c: any) => ({
            CourseId: c.courseId,
            CourseName: c.courseName,
            Grade: c.grade,
            Credit: c.credit
        }));
        return getEligibleCoursesForStudent(mapped, 'general');
    }, [studentData]);

    const displayCoursesByCategory = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!useMyData) {
            // Flat list
            const pool = allCourseNames;
            const filtered = q ? pool.filter(n => n.toLowerCase().includes(q)) : pool;
            return { 'Catalogue': filtered };
        }

        // Categorized list of eligible courses
        const grouped: Record<string, string[]> = {};

        // 1. Add recommendations if they exist
        if (rlRecommendedNames.length > 0) {
            grouped['Recommended for You'] = [...rlRecommendedNames];
        }

        // 2. Add other eligible courses
        const rlNamesSet = new Set(rlRecommendedNames.map(n => n.toLowerCase()));
        for (const item of eligibleCourses) {
            if (q && !item.courseName.toLowerCase().includes(q)) continue;
            if (rlNamesSet.has(item.courseName.toLowerCase())) continue; // Avoid duplicates

            const cat = item.category || 'Core';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item.courseName);
        }
        return grouped;
    }, [useMyData, eligibleCourses, allCourseNames, query, rlRecommendedNames]);

    const completedCourseBlockNames = useMemo(() => {
        if (!studentData?.education?.semesters) return [];
        const passedCourses = studentData.education.semesters.flatMap((s: any) => s.courses);

        const blockNames = new Set<string>();
        passedCourses.forEach((c: any) => {
            if (c.courseId) blockNames.add(c.courseId.toLowerCase().trim());
            if (c.courseName) blockNames.add(c.courseName.toLowerCase().trim());

            const mapping = courseMappings.find(m =>
                m.courseCode?.toLowerCase().trim() === c.courseId?.toLowerCase().trim() ||
                m.policyName?.toLowerCase().trim() === c.courseName?.toLowerCase().trim()
            );

            if (mapping) {
                if (mapping.policyName) blockNames.add(mapping.policyName.toLowerCase().trim());
                mapping.blockNames?.forEach((bn: string) => blockNames.add(bn.toLowerCase().trim()));
                mapping.academicPlanNames?.forEach((an: string) => blockNames.add(an.toLowerCase().trim()));
                mapping.trackNames?.forEach((tn: string) => blockNames.add(tn.toLowerCase().trim()));
                if (mapping.courseCode) blockNames.add(mapping.courseCode.toLowerCase().trim());
            }
        });
        return Array.from(blockNames);
    }, [studentData, courseMappings, allCourseNames]);

    const displayCoursesByCategoryFiltered = useMemo(() => {
        if (!prefs.hideCompleted) return displayCoursesByCategory;

        const filtered: Record<string, string[]> = {};
        Object.entries(displayCoursesByCategory).forEach(([cat, names]) => {
            const filteredNames = names.filter(n => !completedCourseBlockNames.includes(n.toLowerCase().trim()));
            if (filteredNames.length > 0) {
                filtered[cat] = filteredNames;
            }
        });
        return filtered;
    }, [displayCoursesByCategory, prefs.hideCompleted, completedCourseBlockNames]);
    useEffect(() => {
        const activeSelectedCourses = useMyData ? advisorSelectedNames : manualSelectedNames;
        if (activeSelectedCourses.length === 0) {
            setCategorizedInstructors({ doctors: [], tas: [] });
            return;
        }

        const lvl = prefs.level || undefined;
        schedulingApi.getCategorizedInstructors(activeSelectedCourses, lvl)
            .then(res => setCategorizedInstructors(res))
            .catch(e => console.warn('Failed to load categorized instructors:', e));
    }, [useMyData, advisorSelectedNames, manualSelectedNames, prefs.level]);

    const displayInstructors = useMemo(() => {
        const q = instrQuery.toLowerCase().trim();
        const docs = Array.isArray(categorizedInstructors?.doctors) ? categorizedInstructors.doctors : [];
        const teachingAssistants = Array.isArray(categorizedInstructors?.tas) ? categorizedInstructors.tas : (Array.isArray((categorizedInstructors as any)?.tAs) ? (categorizedInstructors as any).tAs : []);
        const doctors = docs.filter((i: string) => !q || i.toLowerCase().includes(q));
        const tas = teachingAssistants.filter((i: string) => !q || i.toLowerCase().includes(q));
        return { doctors, tas };
    }, [categorizedInstructors, instrQuery]);


    const toggleCourseName = (name: string) => {
        if (useMyData) {
            setAdvisorSelectedNames(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
        } else {
            setManualSelectedNames(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
        }
    };
    const toggleDay = (d: DayOfWeek) =>
        setPrefs(p => ({
            ...p,
            preferredDays: p.preferredDays.includes(d)
                ? p.preferredDays.filter(x => x !== d)
                : [...p.preferredDays, d],
        }));
    const toggleInstructor = (i: string) =>
        setPrefs(p => ({
            ...p,
            preferredInstructors: p.preferredInstructors.includes(i)
                ? p.preferredInstructors.filter(x => x !== i)
                : [...p.preferredInstructors, i],
        }));

    const handleGetRecommendations = useCallback(async (matchCoursesOnly: boolean = false, topN: number = 5) => {
        setComputing(true);
        try {
            const coursesToSend = useMyData ? advisorSelectedNames : manualSelectedNames;

            // Auto-detect: if the user hasn't modified any preferences from defaults,
            // use matchCoursesOnly=true to focus purely on course content matching.
            const prefsAreDefault =
                prefs.preferredDays.length === 0 &&
                prefs.numPreferredDays === DEFAULT_PREFS.numPreferredDays &&
                prefs.maxDaysPerWeek === DEFAULT_PREFS.maxDaysPerWeek &&
                prefs.maxGapHours === DEFAULT_PREFS.maxGapHours &&
                prefs.earliestTime === DEFAULT_PREFS.earliestTime &&
                prefs.latestTime === DEFAULT_PREFS.latestTime &&
                prefs.preferredInstructors.length === 0 &&
                prefs.scheduleType === DEFAULT_PREFS.scheduleType;

            const shouldMatchCoursesOnly = matchCoursesOnly || prefsAreDefault;
            const res = await schedulingApi.getRecommendations(prefs, coursesToSend, topN, shouldMatchCoursesOnly);

            setResults(res);
            setAppliedCourses(coursesToSend);
            setAppliedPrefs({ ...prefs });
            setAppliedUseMyData(useMyData);
            setLastConfig(JSON.stringify({ prefs, manualSelectedNames, advisorSelectedNames, useMyData }));

            // Sync active semester from the first result if available
            if (res.length > 0 && res[0].block.semester && res[0].block.semester !== activeSemester) {
                setActiveSemester(res[0].block.semester);
            }
        } catch (e) {
            console.warn('Recommender error:', e);
            setResults([]);
        } finally {
            setComputing(false);
        }
    }, [prefs, manualSelectedNames, advisorSelectedNames, useMyData, activeSemester]);

    const handleReset = () => {
        setUseMyData(null);
        setManualSelectedNames([]);
        setAdvisorSelectedNames([]);
        setAppliedCourses([]);
        setPrefs(p => ({ ...p, ...DEFAULT_PREFS }));
        setResults([]);
        setLastConfig(null);
        setQuery('');
        setInstrQuery('');
    };

    const scoreColor = (score: number) =>
        score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';

    const canAdvanceStep0 = useMyData !== null;

    return (
        <div className="min-h-screen bg-slate-50">
            <SchedulingHeader activeTab={activeTab} setActiveTab={handleTabChange} TABS={TABS} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {activeTab === 'my-schedule' && (
                    <MyScheduleTab 
                        viewMode={viewMode} 
                        setViewMode={setViewMode} 
                        registration={myRegistration}
                        latestRegistration={latestRegistration}
                        onRefresh={() => initializeData()}
                        studentData={studentData}
                        activeSemester={activeSemester}
                        originalRecBlock={originalRecBlock}
                        useMyData={useMyData}
                        rlRecommendedNames={rlRecommendedNames}
                    />
                )}

                {activeTab === 'blocks-explorer' && (
                    <BlocksExplorerTab
                        filteredBlocks={filteredBlocks}
                        paginatedBlocks={paginatedBlocks}
                        blocksLoading={blocksLoading}
                        blockLevelTab={blockLevelTab}
                        setBlockLevelTab={setBlockLevelTab}
                        blockQuery={blockQuery}
                        setBlockQuery={setBlockQuery}
                        totalBlockPages={totalBlockPages}
                        blockCurrentPage={blockCurrentPage}
                        setBlockCurrentPage={setBlockCurrentPage}
                        activeSemester={activeSemester}
                    />
                )}

                {activeTab === 'assistant' && (
                    <ScheduleAssistantTab
                        useMyData={useMyData}
                        setUseMyData={setUseMyData}
                        LEVELS={LEVELS}
                        prefs={prefs}
                        setPrefs={setPrefs}
                        query={query}
                        setQuery={setQuery}
                        instrQuery={instrQuery}
                        setInstrQuery={setInstrQuery}
                        displayCoursesByCategory={displayCoursesByCategoryFiltered}
                        completedCourseBlockNames={completedCourseBlockNames}
                        advisorSelectedNames={advisorSelectedNames}
                        setAdvisorSelectedNames={setAdvisorSelectedNames}
                        manualSelectedNames={manualSelectedNames}
                        rlRecommendedNames={rlRecommendedNames}
                        toggleCourseName={toggleCourseName}
                        displayInstructors={displayInstructors}
                        toggleInstructor={toggleInstructor}
                        toggleDay={toggleDay}
                        DAYS={DAYS}
                        computing={computing}
                        results={results}
                        appliedCourses={appliedCourses}
                        appliedPrefs={appliedPrefs}
                        appliedUseMyData={appliedUseMyData}
                        isDirty={isDirty}
                        handleReset={handleReset}
                        handleGetRecommendations={handleGetRecommendations}
                        setPreviewBlock={setPreviewBlock}
                        prefsAreDefault={prefsAreDefault}
                        activeSemester={activeSemester}
                        studentData={studentData}
                        myRegistration={myRegistration}
                        onRegistrationUpdate={() => initializeData()}
                        setOriginalRecBlock={setOriginalRecBlock}
                        rlLoading={rlLoading}
                    />
                )}
                <SchedulePreviewModal
                    previewBlock={previewBlock}
                    setPreviewBlock={setPreviewBlock}
                    previewCourse={previewCourse}
                    setPreviewCourse={setPreviewCourse}
                    completedCourseBlockNames={completedCourseBlockNames}
                    initialHideCompleted={prefs.hideCompleted}
                />
            </div>

        </div>
    );
}

export default function SchedulingPage() {
    return (
        <Suspense fallback={<SchedulingSkeleton />}>
            <SchedulingPageInner />
        </Suspense>
    );
}

function SchedulingSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col items-center text-center mb-8 animate-pulse">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl mb-4" />
                        <div className="h-10 w-64 bg-slate-200 rounded-xl mb-3" />
                        <div className="h-4 w-96 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="flex justify-center gap-1 mb-0">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 w-40 bg-slate-50 border-t border-x border-slate-100 rounded-t-2xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                            <div className="h-4 w-32 bg-slate-100 rounded-md" />
                        </div>
                        <div className="h-10 w-32 bg-white border border-slate-100 rounded-2xl" />
                    </div>
                    <div className="h-[500px] bg-white rounded-3xl border border-slate-100 shadow-sm" />
                </div>
            </div>
        </div>
    );
}