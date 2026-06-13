import { getToken, parseJwt } from '@/lib/auth';

export interface CachedStudentSchedule {
    activeRegistration: any | null;
    latestRegistration: any | null;
    cachedAt: number;
    fetchedOk?: boolean;
}

function getCacheKey(): string | null {
    const token = getToken();
    if (!token) return null;
    const user = parseJwt(token);
    return user?.id ? `nupal_schedule_cache:${user.id}` : null;
}

export function hasScheduleCache(): boolean {
    const cached = loadScheduleFromCache();
    return cached?.fetchedOk === true;
}

export function loadScheduleFromCache(): CachedStudentSchedule | null {
    const key = getCacheKey();
    if (!key || typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as CachedStudentSchedule;
    } catch {
        return null;
    }
}

export function saveScheduleToCache(
    activeRegistration: any | null,
    latestRegistration: any | null,
    fetchedOk = true,
): void {
    const key = getCacheKey();
    if (!key || typeof window === 'undefined') return;

    const payload: CachedStudentSchedule = {
        activeRegistration,
        latestRegistration,
        cachedAt: Date.now(),
        fetchedOk,
    };

    try {
        localStorage.setItem(key, JSON.stringify(payload));
    } catch {
        // Ignore quota errors
    }
}

export function clearScheduleCache(): void {
    const key = getCacheKey();
    if (!key || typeof window === 'undefined') return;
    localStorage.removeItem(key);
}
