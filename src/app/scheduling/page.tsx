'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    CalendarDays, Layers, Sparkles, Calendar as CalendarIcon,
    Search, Check, ChevronLeft, ChevronRight,
    Clock, Loader2, UserCheck,
    Minus, Plus, RotateCcw, ChevronDown,
    AlertCircle, X
} from 'lucide-react';
import { getToken, parseJwt } from '@/lib/auth';
import { hasScheduleCache, loadScheduleFromCache, saveScheduleToCache, clearScheduleCache } from '@/lib/scheduleCache';
import { MY_SCHEDULE_COURSES } from '@/data/schedulingData';
import { Block, CourseSession, DayOfWeek, SchedulePreferences, RecommendationResult } from '@/types/scheduling';
import { schedulingApi } from '@/services/schedulingApi';
import { getEligibleCoursesForStudent } from '@/utils/eligibilityEngine';
import SchedulingHeader from '@/components/scheduling/SchedulingHeader';
import MyScheduleTab from '@/components/scheduling/MyScheduleTab';
import BlocksExplorerTab from '@/components/scheduling/BlocksExplorerTab';
import ScheduleAssistantTab from '@/components/scheduling/ScheduleAssistantTab';
import SchedulePreviewModal from '@/components/scheduling/SchedulePreviewModal';


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

const canonicalCourseKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');

const formatTime = (time?: string) => {
    if (!time) return '';
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m} ${suffix}`;
};

const isCourseMatch = (name1: string, name2: string, strict = false) => {
    const k1 = canonicalCourseKey(name1);
    const k2 = canonicalCourseKey(name2);
    
    const tokens1 = k1.split(/\s+/).filter(t => t.length > 2 || /^[ivxldm0-9]+$/i.test(t));
    const tokens2 = k2.split(/\s+/).filter(t => t.length > 2 || /^[ivxldm0-9]+$/i.test(t));
    
    if (tokens1.length === 0 || tokens2.length === 0) return k1.includes(k2) || k2.includes(k1);
    
    const common = tokens1.filter(t1 => tokens2.some(t2 => t2 === t1 || t2.startsWith(t1) || t1.startsWith(t2)));
    const threshold = Math.min(tokens1.length, tokens2.length);
    
    if (strict) {
        return common.length >= threshold;
    }
    
    return common.length >= threshold || (threshold > 1 && common.length >= threshold - 1);
};

const parseTime = (t: string) => {
    if (!t) return 0;
    const parts = t.split(':');
    if (parts.length < 2) return 0;
    const [h, m] = parts.map(Number);
    return h * 60 + m;
};

export function SchedulingPageInner() {
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
    const [myRegistration, setMyRegistration] = useState<any | null>(() => {
        const cached = loadScheduleFromCache();
        return cached?.fetchedOk ? cached.activeRegistration ?? null : null;
    });
    const [latestRegistration, setLatestRegistration] = useState<any | null>(() => {
        const cached = loadScheduleFromCache();
        return cached?.fetchedOk ? cached.latestRegistration ?? null : null;
    });
    const [originalRecBlock, setOriginalRecBlock] = useState<any | null>(null);
    const [regsLoading, setRegsLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(() => !hasScheduleCache());
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

    // Shared derived data for schedule & approval status
    const selectedBlock = myRegistration?.selectedBlock ?? myRegistration?.selected_block;

    const registeredCourses = useMemo((): CourseSession[] => {
        return selectedBlock?.courses?.map((c: any): CourseSession => ({
            courseId: c.courseId || c.course_id || '',
            courseName: c.courseName || c.course_name || '',
            section: c.section,
            type: c.type || c.subtype || 'Lecture',
            instructor: c.instructor,
            day: c.day,
            start: c.startTime || c.start_time || '',
            end: c.endTime || c.end_time || '',
            room: c.room,
            color: c.color,
            credits: 3
        })) || [];
    }, [selectedBlock]);


    const isRejected = latestRegistration?.status === 'Rejected' && !myRegistration;
    const displayCourses = useMemo(() => {
        return registeredCourses.length > 0 ? registeredCourses : (isRejected ? [] : MY_SCHEDULE_COURSES);
    }, [registeredCourses, isRejected]);

    const registrationStatus = useMemo(() => {
        if (useMyData === false) {
            return { label: 'MANUAL', isFromRec: false, isModified: false };
        }
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
        return { label: 'MANUAL', isFromRec: false, isModified: false };
    }, [useMyData, rlRecommendedNames, displayCourses]);

    // Mobile specific states
    const [mobileSelectedDay, setMobileSelectedDay] = useState<string>('All');
    const [mobilePreviewBlock, setMobilePreviewBlock] = useState<Block | null>(null);
    const [mobileAssistantStep, setMobileAssistantStep] = useState<'setup' | 'results'>('setup');
    const [expandedSection, setExpandedSection] = useState<'courses' | 'prefs' | 'limits' | 'instructors'>('courses');
    const [mobileRegistering, setMobileRegistering] = useState(false);
    const [mobileRegisteringId, setMobileRegisteringId] = useState<string | null>(null);
    const [showApprovalAlerts, setShowApprovalAlerts] = useState(true);
    const [bannerVisible, setBannerVisible] = useState(false);

    // Derived values needed by the mobile assistant section
    const selectedCourses = useMyData ? advisorSelectedNames : manualSelectedNames;

    const filteredResults = useMemo(() => {
        if (!results) return [];
        return results.filter(rec => {
            if (appliedCourses.length > 0) {
                const hasMatch = appliedCourses.some(ac =>
                    rec.block.courses.some((c: CourseSession) =>
                        canonicalCourseKey(ac).split(/\s+/).some(tok =>
                            canonicalCourseKey(c.courseName).includes(tok)
                        )
                    )
                );
                if (!hasMatch) return false;
            }
            return true;
        });
    }, [results, appliedCourses]);

    // Sync notification banners for mobile
    useEffect(() => {
        try {
            const raw = localStorage.getItem('nupal_student_settings');
            if (raw) {
                const s = JSON.parse(raw);
                setShowApprovalAlerts(s.scheduleApprovalAlerts !== false);
            }
        } catch {}
    }, []);

    // Lock body scroll whenever any modal/sheet is open (prevents background scrolling)
    useEffect(() => {
        const isAnyModalOpen = !!(mobilePreviewBlock || previewBlock || previewCourse);
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobilePreviewBlock, previewBlock, previewCourse]);


    useEffect(() => {
        if (latestRegistration && (latestRegistration.status === 'Approved' || latestRegistration.status === 'Rejected')) {
            const regId = latestRegistration.id || latestRegistration._id;
            const storageKey = `nupal_reg_seen_${regId}_${latestRegistration.status}`;
            const hasSeen = localStorage.getItem(storageKey);
            
            if (!hasSeen) {
                setBannerVisible(true);
                localStorage.setItem(storageKey, 'true');
            }
        }
    }, [latestRegistration]);

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
            }
        } catch (e) {
            // Silently catch error
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
        const showScheduleLoading = !hasScheduleCache();
        if (showScheduleLoading) setScheduleLoading(true);
        try {
            // Fetch course mappings first
            let mappings: any[] = [];
            try {
                mappings = await schedulingApi.getCourseMappings();
                setCourseMappings(mappings);
            } catch (e) {
                // Silently handle error
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
                    const schedule = await schedulingApi.getMySchedule();
                    setMyRegistration(schedule.activeRegistration);
                    setLatestRegistration(schedule.latestRegistration);
                    saveScheduleToCache(
                        schedule.activeRegistration,
                        schedule.latestRegistration,
                        true,
                    );
                } catch (e) {
                    console.error('Failed to load student schedule', e);
                } finally {
                    setRegsLoading(false);
                }

                // Fetch RL recommendation
                setRlLoading(true);
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
                    const params = new URLSearchParams({
                        targetTrack: 'general',
                        objectiveProfile: 'balanced',
                    });
                    const url = `${baseUrl}/api/students/${data.account.id}/rl-recommendation?${params.toString()}`;

                    const res = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const rlRaw = await res.json();

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
                    }
                } catch (e) {
                    // Silently handle error
                } finally {
                    setRlLoading(false);
                }
            }
        } catch (err) {
            // Silently handle error
        } finally {
            setScheduleLoading(false);
        }
    }, [activeSemester]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    // Drop stale local schedule cache written before fetchedOk flag existed.
    useEffect(() => {
        const cached = loadScheduleFromCache();
        if (cached && cached.fetchedOk !== true) {
            clearScheduleCache();
        }
    }, []);



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
                .catch(() => {})
                .finally(() => setBlocksLoading(false));
        } else if (!activeSemester) {
            // Just fetch semester if not already fetched
            schedulingApi.getActiveSemester()
                .then(setActiveSemester)
                .catch(() => {});
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
            .catch(() => {});
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
            .catch(() => {});
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

    const handleMobileRegister = async () => {
        if (!studentData) return;
        setMobileRegistering(true);
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
                        type: c.type || c.subtype || "Lecture",
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
            initializeData();
        } catch (e: any) {
            alert("Failed to submit: " + e.message);
        } finally {
            setMobileRegistering(false);
        }
    };

    const handleMobileRegisterBlock = async (rec: RecommendationResult) => {
        if (!studentData) {
            alert("Please wait for student profile to load.");
            return;
        }
        if (myRegistration && (myRegistration.status === 'Pending' || myRegistration.status === 'Approved')) {
            alert("You already have a pending or approved registration. You cannot register for another schedule.");
            return;
        }

        setOriginalRecBlock(rec.block);
        setMobileRegisteringId(rec.block.blockId);
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
                    semester: rec.block.semester || activeSemester || "Fall 2025",
                    courses: rec.block.courses.map(c => ({
                        courseName: c.courseName,
                        section: c.section,
                        type: c.subtype || c.type || "Lecture",
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
            alert("Schedule submitted for approval!");
            initializeData();
        } catch (e: any) {
            alert("Failed to submit schedule: " + e.message);
        } finally {
            setMobileRegisteringId(null);
        }
    };

    const scoreColor = (score: number) =>
        score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';

    const canAdvanceStep0 = useMyData !== null;

    const AccordionSection = ({ 
        id, 
        title, 
        subtitle, 
        isOpen, 
        onToggle, 
        children 
    }: { 
        id: string; 
        title: string; 
        subtitle?: string; 
        isOpen: boolean; 
        onToggle: () => void; 
        children: React.ReactNode 
    }) => (
        <div className="border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden mb-3">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all"
            >
                <div className="flex-1 pr-4">
                    <span className="text-[10px] text-slate-400 dark:text-slate-505 uppercase tracking-wider block font-semibold mb-0.5">Step {id}</span>
                    <span className="text-sm font-black">{title}</span>
                    {subtitle && <span className="text-[10px] font-medium text-[#2F80ED] dark:text-blue-400 block mt-0.5">{subtitle}</span>}
                </div>
                <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} />
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/20">
                    {children}
                </div>
            )}
        </div>
    );

    const coursesText = (useMyData ? advisorSelectedNames : manualSelectedNames).length > 0 
        ? `${(useMyData ? advisorSelectedNames : manualSelectedNames).length} selected` 
        : 'None selected';
    const daysText = prefs.dayMode === 'count' 
        ? `${prefs.numPreferredDays ?? 3} Days/Week` 
        : prefs.preferredDays.length > 0 
            ? prefs.preferredDays.map(d => d.slice(0, 3)).join(', ') 
            : 'Any day';
    const limitsText = `Max ${prefs.maxDaysPerWeek} days • ${prefs.maxGapHours === 0 ? 'No gap limit' : `${prefs.maxGapHours}h max gap`}`;
    const instText = prefs.preferredInstructors.length > 0 ? `${prefs.preferredInstructors.length} selected` : 'Any instructor';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70">
            {/* Desktop Layout */}
            <div className="hidden md:block">
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
                            loading={scheduleLoading}
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

            {/* Mobile Layout */}
            <div className="md:hidden pb-24 bg-slate-50 dark:bg-slate-900/70 min-h-screen">
                {/* Mobile Header & Custom Tab Selector */}
                <div className="bg-white dark:bg-slate-900 px-5 pt-6 pb-5 rounded-b-[2rem] shadow-sm relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-[#2F80ED]" />
                                    Scheduler
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Build conflict-free slots</p>
                            </div>
                            {activeSemester && (
                                <span className="text-[10px] font-black text-[#2F80ED] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-100/50">
                                    {activeSemester}
                                </span>
                            )}
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner w-full">
                            {TABS.map(({ id, label, icon: Icon }) => {
                                const active = activeTab === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => handleTabChange(id)}
                                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 ${active
                                            ? 'bg-white dark:bg-slate-900 text-[#2F80ED] shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <Icon size={15} className={`mb-1 transition-transform ${active ? 'scale-110' : ''}`} />
                                        {label.split(' ')[0]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-4 py-4">
                    {/* 1. Mobile My Schedule Tab */}
                    {activeTab === 'my-schedule' && (
                        <div className="space-y-4">
                            {/* Pending Alert Banner */}
                            {myRegistration?.status === 'Pending' && showApprovalAlerts && (
                                <div className="p-4 rounded-2xl border bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center gap-3">
                                    <Clock size={18} className="animate-pulse shrink-0 text-amber-500" />
                                    <div>
                                        <p className="text-xs font-black">Status: Pending Approval</p>
                                        <p className="text-[10px] font-medium opacity-85 mt-0.5">Your schedule is waiting for administrative approval.</p>
                                    </div>
                                </div>
                            )}

                            {/* Approved/Rejected One-time Banner */}
                            {bannerVisible && latestRegistration && showApprovalAlerts && (
                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                                    latestRegistration.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 text-emerald-800 dark:text-emerald-200' :
                                    'bg-rose-50 dark:bg-rose-950/40 border-rose-100 text-rose-800 dark:text-rose-200'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            latestRegistration.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
                                        }`}>
                                            {latestRegistration.status === 'Approved' ? <Check size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Registration {latestRegistration.status}</p>
                                            <p className="text-[10px] font-medium opacity-85 mt-0.5">
                                                {latestRegistration.status === 'Approved' 
                                                    ? `Your schedule is approved! ${latestRegistration.adminNote ? `Note: ${latestRegistration.adminNote}` : ''}`
                                                    : `Your schedule was rejected: ${latestRegistration.adminNote || 'No reason provided.'}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setBannerVisible(false)} className="p-1 hover:bg-black/5 rounded-full shrink-0"><X size={14} /></button>
                                </div>
                            )}

                            {/* Header Section */}
                            <div className="flex items-center justify-between mb-1 pl-1">
                                <div>
                                    <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Schedule Timetable</h2>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{displayCourses.length} Enrolled Courses</p>
                                </div>
                            </div>

                            {/* Day selection horizontal scroll bar */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                                {['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'].map((day) => {
                                    const active = mobileSelectedDay === day;
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setMobileSelectedDay(day)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all border ${
                                                active 
                                                    ? 'bg-[#2F80ED] border-[#2F80ED] text-white shadow-sm shadow-blue-200' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {day === 'All' ? 'All Days' : day.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Schedule Timeline Grid / List */}
                            {scheduleLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Loader2 size={28} className="animate-spin text-[#2F80ED] mb-2" />
                                    <p className="text-xs font-semibold">Loading schedule details...</p>
                                </div>
                            ) : displayCourses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                                    <CalendarDays size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Courses Added</h3>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Use the Schedule Assistant tab to generate recommendation options.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {displayCourses
                                        .filter(c => mobileSelectedDay === 'All' || (c.day && c.day.toLowerCase().includes(mobileSelectedDay.toLowerCase())))
                                        .sort((a, b) => parseTime(a.start) - parseTime(b.start))
                                        .map((course, idx) => {
                                            const color = course.color || '#3b82f6';
                                            return (
                                                <div 
                                                    key={`${course.courseId}-${idx}`} 
                                                    onClick={() => setPreviewCourse(course)}
                                                    className="flex items-stretch bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden active:scale-98 transition-all p-3.5"
                                                >
                                                    {/* Time column */}
                                                    <div className="w-16 shrink-0 flex flex-col justify-center border-r border-slate-100 dark:border-slate-800 pr-2">
                                                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-none">{formatTime(course.start)}</span>
                                                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase truncate">{formatTime(course.end)}</span>
                                                    </div>
                                                    {/* Vertical indicator bar */}
                                                    <div className="w-1 rounded-full mx-2 shrink-0" style={{ backgroundColor: color }} />
                                                    {/* Text details */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{course.courseName}</h4>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                                                            <span>{course.courseId}</span>
                                                            {course.section && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Sec {course.section}</span>
                                                                </>
                                                            )}
                                                            {course.room && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Room {course.room}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                                                            Instructor: {course.instructor || 'Staff'}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0 self-center" />
                                                </div>
                                            );
                                        })}
                                    
                                    {displayCourses.filter(c => mobileSelectedDay !== 'All' && !(c.day && c.day.toLowerCase().includes(mobileSelectedDay.toLowerCase()))).length === displayCourses.length && (
                                        <div className="py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                                            No classes scheduled on {mobileSelectedDay}.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sticky submit button for approval */}
                            {!myRegistration && displayCourses.length > 0 && (
                                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-40 flex justify-center">
                                    <button
                                        onClick={handleMobileRegister}
                                        disabled={mobileRegistering}
                                        className="w-full max-w-md py-3 rounded-2xl bg-[#2F80ED] hover:bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-200/50 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {mobileRegistering ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                                        Submit for Approval ({registrationStatus.label})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. Mobile Blocks Explorer Tab */}
                    {activeTab === 'blocks-explorer' && (
                        <div className="space-y-4">
                            {/* Level filters (FR, SO, JR, SR, ALL) - horizontal scroll row */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                                {(['FR', 'SO', 'JR', 'SR', 'ALL'] as const).map((lvl) => {
                                    const isActive = blockLevelTab === lvl;
                                    return (
                                        <button
                                            key={lvl}
                                            onClick={() => setBlockLevelTab(lvl)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all border ${
                                                isActive 
                                                    ? 'bg-[#2F80ED] border-[#2F80ED] text-white' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                        >
                                            {lvl === 'ALL' ? 'All Levels' : lvl === 'FR' ? 'Freshman' : lvl === 'SO' ? 'Sophomore' : lvl === 'JR' ? 'Junior' : 'Senior'}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search Box */}
                            <div>
                                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <Search size={14} className="text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        className="flex-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                        placeholder="Search blocks or specific courses..."
                                        value={blockQuery}
                                        onChange={e => setBlockQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Blocks cards list */}
                            {blocksLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredBlocks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-500">
                                    <Layers size={44} className="mb-2" />
                                    <p className="text-xs font-bold">No blocks found matching filters.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paginatedBlocks.map(block => {
                                        const uniqueDays = [...new Set(block.courses.map(c => c.day))];
                                        return (
                                            <div key={`${block.blockId}-${block.semester}`} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{block.blockId}</h4>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{block.totalCredits} Credits • {uniqueDays.length} Days/Wk</p>
                                                    </div>
                                                    <span className="text-[9px] font-black text-[#2F80ED] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100/50">
                                                        {block.semester}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1.5 mb-3.5">
                                                    {uniqueDays.map(d => (
                                                        <span key={d} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                                                            {d.slice(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setMobilePreviewBlock(block)}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50/20 hover:bg-[#2F80ED] text-[#2F80ED] hover:text-white text-xs font-bold transition-all"
                                                >
                                                    <CalendarDays size={14} />
                                                    View Courses
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* Simplified Mobile Pagination Controls */}
                                    {totalBlockPages > 1 && (
                                        <div className="flex items-center justify-center gap-3 py-6">
                                            <button
                                                onClick={() => setBlockCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={blockCurrentPage === 1}
                                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-400 disabled:opacity-40"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                Page {blockCurrentPage} of {totalBlockPages}
                                            </span>
                                            <button
                                                onClick={() => setBlockCurrentPage(p => Math.min(totalBlockPages, p + 1))}
                                                disabled={blockCurrentPage === totalBlockPages}
                                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-400 disabled:opacity-40"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. Mobile Schedule Assistant Tab */}
                    {activeTab === 'assistant' && (
                        <div className="space-y-4">
                            {mobileAssistantStep === 'setup' ? (
                                <div>
                                    {/* Wizard setup Collapsible Accordion sections */}
                                    <AccordionSection
                                        id="1"
                                        title="Select Course Requirements"
                                        subtitle={coursesText}
                                        isOpen={expandedSection === 'courses'}
                                        onToggle={() => setExpandedSection(prev => prev === 'courses' ? 'prefs' : 'courses')}
                                    >
                                        <div className="space-y-4">
                                            {/* Data Source Selector */}
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <button
                                                    onClick={() => {
                                                        setUseMyData(true);
                                                        if (advisorSelectedNames.length === 0 && rlRecommendedNames.length > 0) {
                                                            setAdvisorSelectedNames([...rlRecommendedNames]);
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-20 ${useMyData === true ? 'border-[#2F80ED] bg-blue-50/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900'}`}
                                                >
                                                    <UserCheck size={16} className="text-[#2F80ED]" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100">Sync Advisor</p>
                                                        <p className="text-[8px] text-slate-400 mt-0.5">Use recommended blocks</p>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setUseMyData(false)}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-20 ${useMyData === false ? 'border-[#2F80ED] bg-blue-50/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900'}`}
                                                >
                                                    <Search size={16} className="text-[#2F80ED]" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100">Browse Catalog</p>
                                                        <p className="text-[8px] text-slate-400 mt-0.5">Hand-pick courses</p>
                                                    </div>
                                                </button>
                                            </div>

                                            {useMyData === false && (
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Academic Level</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {LEVELS.map(l => {
                                                            const on = prefs.level === l.id;
                                                            return (
                                                                <button
                                                                    key={l.id}
                                                                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                                                                    onClick={() => setPrefs(p => ({ ...p, level: l.id }))}
                                                                >
                                                                    {l.label.split(' ')[0]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {useMyData !== null && (
                                                <div className="space-y-3">
                                                    {/* Hide Passed Passed Switch */}
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, hideCompleted: !p.hideCompleted }))}
                                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${prefs.hideCompleted ? 'bg-indigo-50/20 border-indigo-200 dark:border-indigo-800/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Hide Passed Courses</span>
                                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${prefs.hideCompleted ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${prefs.hideCompleted ? 'left-4' : 'left-0.5'}`} />
                                                        </div>
                                                    </button>

                                                    {/* Search input */}
                                                    <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950/20 focus-within:border-blue-300 transition-all">
                                                        <Search size={14} className="text-slate-400" />
                                                        <input
                                                            type="text"
                                                            className="flex-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                                            placeholder="Search course name..."
                                                            value={query}
                                                            onChange={e => setQuery(e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Courses Lists */}
                                                    <div className="max-h-[220px] overflow-y-auto pr-1 scrollbar-hide space-y-3">
                                                        {rlLoading && useMyData && rlRecommendedNames.length === 0 && (
                                                            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                                                <Loader2 size={20} className="animate-spin mb-1" />
                                                                <p className="text-[10px] font-bold">Loading recommendations...</p>
                                                            </div>
                                                        )}
                                                        
                                                        {!rlLoading && useMyData && rlRecommendedNames.length === 0 && (
                                                            <p className="text-center text-[10px] text-slate-400 py-6">No advisor recommendations found.</p>
                                                        )}

                                                        {Object.entries(displayCoursesByCategoryFiltered).map(([category, names]) => (
                                                            <div key={category} className="space-y-1.5">
                                                                <div className="flex justify-between items-center mt-1">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{category}</span>
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
                                                                            className="text-[9px] font-extrabold text-[#2F80ED]"
                                                                        >
                                                                            {names.every((n: string) => advisorSelectedNames.includes(n)) ? 'Deselect All' : 'Select All'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {names.map(name => {
                                                                    const isSelected = useMyData ? advisorSelectedNames.includes(name) : manualSelectedNames.includes(name);
                                                                    const isRecommended = rlRecommendedNames.some(rn => isCourseMatch(rn, name, true));
                                                                    return (
                                                                        <button
                                                                            key={name}
                                                                            onClick={() => toggleCourseName(name)}
                                                                            className={`w-full flex items-center gap-2.5 rounded-xl p-2.5 border text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                                                                        >
                                                                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'border-[#2F80ED] bg-[#2F80ED]' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                                {isSelected && <Check size={8} className="text-white" />}
                                                                            </div>
                                                                            <span className={`text-[11px] font-bold flex-1 truncate ${isSelected ? 'text-blue-900 dark:text-blue-200 font-extrabold' : 'text-slate-700 dark:text-slate-200'}`}>{name}</span>
                                                                            {isRecommended && <span className="text-[8px] font-black text-green-600 bg-green-50 px-1 py-0.5 rounded shrink-0">Rec</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionSection>

                                    <AccordionSection
                                        id="2"
                                        title="Days & Timing Preference"
                                        subtitle={daysText}
                                        isOpen={expandedSection === 'prefs'}
                                        onToggle={() => setExpandedSection(prev => prev === 'prefs' ? 'limits' : 'prefs')}
                                    >
                                        <div className="space-y-4">
                                            {/* Count vs Specific */}
                                            <div className="flex gap-2">
                                                {(['count', 'specific'] as const).map(mode => {
                                                    const on = prefs.dayMode === mode;
                                                    return (
                                                        <button key={mode} className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`} onClick={() => setPrefs(p => ({ ...p, dayMode: mode }))}>
                                                            {mode === 'count' ? 'Count Number' : 'Specific Days'}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {prefs.dayMode === 'count' ? (
                                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-2xl w-48 mx-auto">
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, numPreferredDays: Math.max(1, (p.numPreferredDays ?? 3) - 1) }))}
                                                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600"
                                                    >
                                                        <Minus size={12} strokeWidth={2.5} />
                                                    </button>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{prefs.numPreferredDays ?? 3}</span>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Days</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, numPreferredDays: Math.min(6, (p.numPreferredDays ?? 3) + 1) }))}
                                                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600"
                                                    >
                                                        <Plus size={12} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap justify-center gap-1.5">
                                                    {DAYS.map(d => {
                                                        const on = prefs.preferredDays.includes(d);
                                                        return (
                                                            <button key={d} className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`} onClick={() => toggleDay(d)}>
                                                                {d.slice(0, 3)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Schedule type styles */}
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Optimize Target</label>
                                                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                    {(['balanced', 'early_classes', 'late_classes'] as const).map((style) => {
                                                        const active = prefs.scheduleType === style;
                                                        return (
                                                            <button
                                                                key={style}
                                                                onClick={() => setPrefs(p => ({ ...p, scheduleType: style }))}
                                                                className={`py-2 px-1 rounded-lg text-[9px] font-bold transition-all text-center ${
                                                                    active 
                                                                        ? 'bg-white dark:bg-slate-900 text-[#2F80ED] shadow-sm' 
                                                                        : 'text-slate-500 dark:text-slate-400'
                                                                }`}
                                                            >
                                                                {style === 'balanced' ? 'Balanced' : style === 'early_classes' ? 'Morning' : 'Evening'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionSection>

                                    <AccordionSection
                                        id="3"
                                        title="Hard Restrictions & Limits"
                                        subtitle={limitsText}
                                        isOpen={expandedSection === 'limits'}
                                        onToggle={() => setExpandedSection(prev => prev === 'limits' ? 'instructors' : 'limits')}
                                    >
                                        <div className="space-y-4">
                                            {/* Max Days */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Max Days/Week</p>
                                                    <p className="text-[9px] text-slate-400">Strict constraint limit</p>
                                                </div>
                                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1 rounded-xl w-36">
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, maxDaysPerWeek: Math.max(1, p.maxDaysPerWeek - 1) }))}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center text-slate-500"
                                                    >
                                                        <Minus size={10} />
                                                    </button>
                                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{prefs.maxDaysPerWeek}</span>
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, maxDaysPerWeek: Math.min(6, p.maxDaysPerWeek + 1) }))}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center text-slate-500"
                                                    >
                                                        <Plus size={10} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Max Gap Hours */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Max Gap Hours</p>
                                                    <p className="text-[9px] text-slate-400">Strict limit between slots</p>
                                                </div>
                                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1 rounded-xl w-36">
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, maxGapHours: Math.max(0, Math.round((p.maxGapHours - 0.5) * 10) / 10) }))}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center text-slate-500"
                                                    >
                                                        <Minus size={10} />
                                                    </button>
                                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{prefs.maxGapHours === 0 ? 'None' : `${prefs.maxGapHours}h`}</span>
                                                    <button
                                                        onClick={() => setPrefs(p => ({ ...p, maxGapHours: Math.min(8, Math.round((p.maxGapHours + 0.5) * 10) / 10) }))}
                                                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center text-slate-500"
                                                    >
                                                        <Plus size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionSection>

                                    <AccordionSection
                                        id="4"
                                        title="Preferred Instructors"
                                        subtitle={instText}
                                        isOpen={expandedSection === 'instructors'}
                                        onToggle={() => setExpandedSection(prev => prev === 'instructors' ? 'courses' : 'instructors')}
                                    >
                                        <div className="space-y-3">
                                            {/* Search box */}
                                            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950/20 focus-within:border-blue-300 transition-all">
                                                <Search size={14} className="text-slate-400" />
                                                <input
                                                    type="text"
                                                    className="flex-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                                    placeholder="Search instructors..."
                                                    value={instrQuery}
                                                    onChange={e => setInstrQuery(e.target.value)}
                                                />
                                            </div>

                                            {/* Lists */}
                                            {displayInstructors.doctors.length === 0 && displayInstructors.tas.length === 0 ? (
                                                <p className="text-center text-[10px] text-slate-400 py-6">Select courses first to search instructors.</p>
                                            ) : (
                                                <div className="max-h-[160px] overflow-y-auto space-y-3">
                                                    {displayInstructors.doctors.length > 0 && (
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Doctors</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {displayInstructors.doctors.map(instr => {
                                                                    const on = prefs.preferredInstructors.includes(instr);
                                                                    return (
                                                                        <button key={instr} onClick={() => toggleInstructor(instr)} className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350'}`}>
                                                                            {instr}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {displayInstructors.tas.length > 0 && (
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teaching Assistants</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {displayInstructors.tas.map((instr: string) => {
                                                                    const on = prefs.preferredInstructors.includes(instr);
                                                                    return (
                                                                        <button key={instr} onClick={() => toggleInstructor(instr)} className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold transition-all ${on ? 'border-[#2F80ED] bg-[#2F80ED] text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-355'}`}>
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
                                    </AccordionSection>

                                    {/* Action Buttons to Optimize & Reset */}
                                    <div className="mt-6 flex flex-col items-center gap-3">
                                        <button
                                            onClick={() => {
                                                handleGetRecommendations();
                                                setMobileAssistantStep('results');
                                            }}
                                            disabled={selectedCourses.length === 0 || computing}
                                            className="w-full py-3.5 rounded-2xl bg-[#2F80ED] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-extrabold text-xs shadow-md shadow-blue-200/50 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {computing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            Generate Schedule Suggestions
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 py-2 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                        >
                                            <RotateCcw size={12} />
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Header & Back Button */}
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div>
                                            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">AI Suggestions</h2>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{filteredResults.length} matching schedule options</p>
                                        </div>
                                        <button
                                            onClick={() => setMobileAssistantStep('setup')}
                                            className="text-xs font-bold text-[#2F80ED] bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl flex items-center gap-1"
                                        >
                                            <ChevronLeft size={14} />
                                            Inputs
                                        </button>
                                    </div>

                                    {/* Results Cards List */}
                                    {computing ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                            <Loader2 size={32} className="animate-spin text-[#2F80ED] mb-3" />
                                            <p className="text-xs font-black">Optimizing timetable configurations...</p>
                                        </div>
                                    ) : filteredResults.length === 0 ? (
                                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-400">
                                            <Sparkles size={40} className="mb-2 mx-auto text-slate-300" />
                                            <p className="text-xs font-bold">No conflict-free schedules found.</p>
                                            <p className="text-[9px] text-slate-400 mt-1 max-w-[200px] mx-auto">Try relaxing your limits, picking fewer courses, or adding more days.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredResults.map((rec, index) => {
                                                const matchScore = rec.matchScore ?? 0;
                                                const uniqueDays = [...new Set(rec.block.courses.map(c => c.day))];
                                                const blockAny = rec.block as any;
                                                const isRegisteredThisBlock = myRegistration?.selectedBlock?.blockId === rec.block.blockId || myRegistration?.selected_block?.blockId === rec.block.blockId;
                                                return (
                                                    <div key={rec.block.blockId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm relative overflow-hidden">
                                                        <div className="flex justify-between items-start mb-2.5">
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Option #{index + 1}</span>
                                                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">{rec.block.blockId}</h4>
                                                            </div>
                                                            <span className="text-xs font-black" style={{ color: scoreColor(matchScore) }}>{matchScore}% Match</span>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-50 dark:bg-slate-950/20 rounded-xl mb-3.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                                                            <div>Credits: <span className="text-slate-850 dark:text-slate-100">{rec.block.totalCredits}</span></div>
                                                            <div>Gaps: <span className="text-slate-850 dark:text-slate-100">{blockAny.maxGapHours || 0}h max</span></div>
                                                            <div>Days: <span className="text-slate-850 dark:text-slate-100">{uniqueDays.length} days</span></div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setMobilePreviewBlock(rec.block)}
                                                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center"
                                                            >
                                                                View Courses
                                                            </button>
                                                            {!isRegisteredThisBlock && (
                                                                <button
                                                                    disabled={mobileRegisteringId === rec.block.blockId || (myRegistration && (myRegistration.status === 'Pending' || myRegistration.status === 'Approved'))}
                                                                    onClick={() => handleMobileRegisterBlock(rec)}
                                                                    className="flex-1 py-2.5 rounded-xl bg-[#2F80ED] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                                >
                                                                    {mobileRegisteringId === rec.block.blockId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                                                                    Submit Block
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Block Courses Popup Modal (Bottom sheet slide-up layout) */}
            {mobilePreviewBlock && (
                <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setMobilePreviewBlock(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] w-full max-w-md max-h-[75vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{mobilePreviewBlock.blockId}</h3>
                                <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mt-0.5">{mobilePreviewBlock.totalCredits} Credits • {mobilePreviewBlock.semester || activeSemester}</p>
                            </div>
                            <button onClick={() => setMobilePreviewBlock(null)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl">
                                Done
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                            {mobilePreviewBlock.courses.map((course, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setPreviewCourse(course)}
                                    className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl active:scale-98 transition-all"
                                >
                                    <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: course.color || '#3b82f6' }} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 truncate leading-snug">{course.courseName}</h4>
                                        <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase mt-0.5">{course.courseId} • Sec {course.section || 'N/A'}</p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTime(course.start)} - {formatTime(course.end)} ({course.day})
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Global preview course details drawer */}
            <SchedulePreviewModal
                previewBlock={previewBlock}
                setPreviewBlock={setPreviewBlock}
                previewCourse={previewCourse}
                setPreviewCourse={setPreviewCourse}
                completedCourseBlockNames={completedCourseBlockNames}
                initialHideCompleted={prefs.hideCompleted}
            />
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 pt-8 pb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col items-center text-center mb-8 animate-pulse">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl mb-4" />
                        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl mb-3" />
                        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    </div>
                    <div className="flex justify-center gap-1 mb-0">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 w-40 bg-slate-50 dark:bg-slate-900/70 border-t border-x border-slate-100 dark:border-slate-800 rounded-t-2xl" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-md" />
                        </div>
                        <div className="h-10 w-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl" />
                    </div>
                    <div className="h-[500px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm" />
                </div>
            </div>
        </div>
    );
}