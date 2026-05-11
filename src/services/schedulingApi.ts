// ─── Scheduling API Service (Web) ────────────────────────────────────────────
// All calls go to NUPAL-Core-Services /api/scheduling/…

import { getToken } from '@/lib/auth';
import {
    Block,
    CourseSession,
    SchedulePreferences,
    RecommendationResult,
} from '@/types/scheduling';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ── Helper ────────────────────────────────────────────────────────────────────
async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
    };
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 204) return null as any;

    const text = await res.text();
    if (!res.ok) {
        let errMessage = res.statusText;
        try {
            const err = text ? JSON.parse(text) : null;
            errMessage = err?.message || err?.error || res.statusText;
        } catch (e) {}
        throw new Error(errMessage);
    }

    return (text ? JSON.parse(text) : null) as any;
}

// ── Types returned by backend (mirrors SchedulingDtos.cs) ─────────────────────


// ── Map backend CourseSessionDto → frontend CourseSession ─────────────────────
// The backend already returns camelCase-friendly DTOs; we just alias them.
type ApiCourseSession = Omit<CourseSession, 'courseId'> & { courseId: string; courseName: string; instructor: string; day: string; start: string; end: string; room?: string; section?: string; subtype?: string; instructorType?: string; color?: string };
type ApiBlock = { blockId: string; semester?: string; totalCredits: number; courses: ApiCourseSession[] };
type ApiRecommendation = {
    block: ApiBlock;
    matchScore: number;
    reasons: string[];
    breakdown: { similarity: number; coverage: number; compactness: number; dayBonus: number };
};

const PALETTE = [
    "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
    "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
    "#14b8a6", "#a855f7", "#0ea5e9", "#d946ef", "#22c55e",
];

function assignColors(courses: ApiCourseSession[]): ApiCourseSession[] {
    const colorMap = new Map<string, string>();
    let colorIdx = 0;

    return courses.map(c => {
        let color = colorMap.get(c.courseName);
        if (!color) {
            color = PALETTE[colorIdx++ % PALETTE.length];
            colorMap.set(c.courseName, color);
        }
        return { ...c, color };
    });
}

// ── Normalise PascalCase API response → camelCase frontend types ──────────────
function normaliseBlock(b: ApiBlock): Block {
    const coloredCourses = assignColors(b.courses || []);
    return {
        blockId: b.blockId,
        semester: b.semester,
        totalCredits: b.totalCredits,
        courses: coloredCourses.map(c => ({
            courseId: c.courseId,
            courseName: c.courseName,
            instructor: c.instructor,
            day: c.day as CourseSession['day'],
            start: c.start,
            end: c.end,
            room: c.room,
            section: c.section,
            subtype: c.subtype,
            instructorType: c.instructorType,
            color: c.color,
        })),
    };
}



function normaliseRecommendation(r: ApiRecommendation): RecommendationResult {
    return {
        block: normaliseBlock(r.block),
        matchScore: r.matchScore,
        reasons: r.reasons || [],
        breakdown: {
            similarity: r.breakdown?.similarity || 0,
            coverage: r.breakdown?.coverage || 0,
            compactness: r.breakdown?.compactness || 0,
            dayBonus: r.breakdown?.dayBonus || 0,
        },
    };
}

export interface CourseMapping {
    id?: string;
    courseCode: string;
    policyName: string;
    blockNames: string[];
    trackNames: string[];
    academicPlanNames: string[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Returns all raw blocks (or filtered by level: JR | SO | SR). */
export async function getBlocks(level?: string): Promise<Block[]> {
    const qs = level ? `?level=${encodeURIComponent(level)}` : '';
    const raw = await apiFetch<ApiBlock[]>(`/api/scheduling/blocks${qs}`);
    return raw.map(normaliseBlock);
}

/** Returns a single block by its ID (e.g. "CS-JR-1A"). */
export async function getBlock(blockId: string): Promise<Block> {
    const raw = await apiFetch<ApiBlock>(`/api/scheduling/blocks/${encodeURIComponent(blockId)}`);
    return normaliseBlock(raw);
}

/** Returns all unique course names for the given level. */
export async function getCourseNames(level?: string): Promise<string[]> {
    const qs = level ? `?level=${encodeURIComponent(level)}` : '';
    return apiFetch<string[]>(`/api/scheduling/courses${qs}`);
}

/** Returns all unique instructor names for the given level. */
export async function getInstructors(level?: string): Promise<string[]> {
    const qs = level ? `?level=${encodeURIComponent(level)}` : '';
    return apiFetch<string[]>(`/api/scheduling/instructors${qs}`);
}

/** Returns categorized instructors for selected courses. */
export async function getCategorizedInstructors(
    courseNames: string[],
    level?: string
): Promise<{ doctors: string[], tas: string[] }> {
    const qs = level ? `?level=${encodeURIComponent(level)}` : '';
    const raw = await apiFetch<{ doctors: string[], tas: string[] }>(`/api/scheduling/instructors/categorized${qs}`, {
        method: 'POST',
        body: JSON.stringify(courseNames)
    });
    return raw;
}

/** Runs the backend recommender and returns ranked blocks. */
export async function getRecommendations(
    prefs: SchedulePreferences,
    desiredCourseNames: string[],
    topN: number = 5,
    matchCoursesOnly: boolean = false,
): Promise<RecommendationResult[]> {
    const body = {
        Preferences: {
            Level: prefs.level,
            PreferredDays: prefs.preferredDays,
            NumPreferredDays: prefs.numPreferredDays,
            DayMode: prefs.dayMode,
            MaxDaysPerWeek: prefs.maxDaysPerWeek,
            MaxGapHours: prefs.maxGapHours,
            EarliestTime: prefs.earliestTime,
            LatestTime: prefs.latestTime,
            PreferredInstructors: prefs.preferredInstructors,
            ScheduleType: prefs.scheduleType,
        },
        DesiredCourseNames: desiredCourseNames,
        TopN: topN,
        MatchCoursesOnly: matchCoursesOnly,
    };

    const raw = await apiFetch<ApiRecommendation[]>('/api/scheduling/recommend', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return raw.map(normaliseRecommendation);
}

/** Returns all course name mappings from the DB. */
export async function getCourseMappings(): Promise<CourseMapping[]> {
    return apiFetch<CourseMapping[]>('/api/CourseMapping/all');
}

/** Returns the currently active semester from system settings. */
export async function getActiveSemester(): Promise<string> {
    const data = await apiFetch<{ semester: string }>('/api/scheduling/active-semester');
    return data.semester;
}

export async function registerSchedule(registration: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    selectedBlock: any;
    isFromRecommendation: boolean;
    isFromRl: boolean;
    isModified: boolean;
}): Promise<void> {
    return apiFetch('/api/scheduling/register', {
        method: 'POST',
        body: JSON.stringify(registration),
    });
}

export async function getRegistrations(): Promise<any[]> {
    return apiFetch('/api/admin/registrations');
}

export async function getMyRegistration(): Promise<any> {
    return apiFetch('/api/scheduling/my-registration');
}

export async function getLatestRegistration(): Promise<any> {
    return apiFetch('/api/scheduling/latest-registration');
}

export async function approveRegistration(id: any, status: string, adminNote?: string): Promise<void> {
    const stringId = typeof id === 'object' ? (id.id || id._id || JSON.stringify(id)) : String(id);
    return apiFetch(`/api/admin/registrations/${stringId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ status, adminNote }),
    });
}

export const schedulingApi = {
    getBlocks,
    getBlock,
    getCourseNames,
    getInstructors,
    getCategorizedInstructors,
    getRecommendations,
    getCourseMappings,
    getActiveSemester,
    registerSchedule,
    getRegistrations,
    getMyRegistration,
    getLatestRegistration,
    approveRegistration,
};
