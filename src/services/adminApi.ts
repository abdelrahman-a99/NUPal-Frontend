import type {
    AdminStudentSummary,
    AdminStudentDetail,
    AdminRlJob,
    AdminRlRecommendation,
    CourseMapping,
    CourseMappingPayload,
    AdminSystemStats,
} from '@/types/admin';

import { getToken } from '@/lib/auth';

const BASE_URL = () => process.env.NEXT_PUBLIC_API_URL;

const adminHeaders = (): HeadersInit => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text();
        let errMsg = text;
        try {
            const json = JSON.parse(text);
            if (json.error) errMsg = json.error;
            else if (json.message) errMsg = json.message;
        } catch (_) {}
        throw new Error(errMsg || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export const adminApi = {
    // ── Students ──────────────────────────────────────────────────────────────

    getStudents: (search?: string, minGpa?: number, maxGpa?: number): Promise<AdminStudentSummary[]> => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (minGpa !== undefined) params.set('minGpa', String(minGpa));
        if (maxGpa !== undefined) params.set('maxGpa', String(maxGpa));
        return fetch(`${BASE_URL()}/api/admin/students?${params}`, { headers: adminHeaders() })
            .then(res => handleResponse<AdminStudentSummary[]>(res));
    },

    getStudent: (id: string): Promise<AdminStudentDetail> =>
        fetch(`${BASE_URL()}/api/admin/students/${id}`, { headers: adminHeaders() })
            .then(res => handleResponse<AdminStudentDetail>(res)),

    // ── RL Engine ─────────────────────────────────────────────────────────────

    getRlJobs: (): Promise<AdminRlJob[]> =>
        fetch(`${BASE_URL()}/api/admin/rl/jobs`, { headers: adminHeaders() })
            .then(res => handleResponse<AdminRlJob[]>(res)),

    getStudentRecommendation: (studentId: string): Promise<AdminRlRecommendation> =>
        fetch(`${BASE_URL()}/api/admin/rl/recommendations/${studentId}`, { headers: adminHeaders() })
            .then(res => handleResponse<AdminRlRecommendation>(res)),

    triggerRl: (studentId: string, isSimulation = false): Promise<{ jobId: string; message: string }> =>
        fetch(`${BASE_URL()}/api/admin/rl/trigger/${studentId}?isSimulation=${isSimulation}`, {
            method: 'POST',
            headers: adminHeaders(),
        }).then(res => handleResponse(res)),

    syncAll: (isSimulation = false): Promise<{ totalStudents: number; triggeredJobs: number }> =>
        fetch(`${BASE_URL()}/api/admin/rl/sync-all?isSimulation=${isSimulation}`, {
            method: 'POST',
            headers: adminHeaders(),
        }).then(res => handleResponse(res)),

    deleteRlJob: (jobId: string): Promise<{ message: string }> =>
        fetch(`${BASE_URL()}/api/admin/rl/jobs/${jobId}`, {
            method: 'DELETE',
            headers: adminHeaders(),
        }).then(res => handleResponse(res)),

    // ── Course Mappings ───────────────────────────────────────────────────────

    getMappings: (): Promise<CourseMapping[]> =>
        fetch(`${BASE_URL()}/api/admin/course-mappings`, { headers: adminHeaders() })
            .then(res => handleResponse<CourseMapping[]>(res)),

    createMapping: (data: CourseMappingPayload): Promise<{ message: string }> =>
        fetch(`${BASE_URL()}/api/admin/course-mappings`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify(data),
        }).then(res => handleResponse(res)),

    updateMapping: (id: string, data: CourseMappingPayload): Promise<{ message: string }> =>
        fetch(`${BASE_URL()}/api/admin/course-mappings/${id}`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify(data),
        }).then(res => handleResponse(res)),

    deleteAllMappings: (): Promise<{ message: string }> =>
        fetch(`${BASE_URL()}/api/admin/course-mappings`, {
            method: 'DELETE',
            headers: adminHeaders(),
        }).then(res => handleResponse(res)),

    // ── System Stats ──────────────────────────────────────────────────────────

    getStats: (): Promise<AdminSystemStats> =>
        fetch(`${BASE_URL()}/api/admin/stats`, { headers: adminHeaders() })
            .then(res => handleResponse<AdminSystemStats>(res)),

    updateActiveSemester: (semester: string): Promise<{ message: string }> =>
        fetch(`${BASE_URL()}/api/admin/settings/active-semester`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify(semester),
        }).then(res => handleResponse(res)),

    // ── Scheduling Blocks ─────────────────────────────────────────────────────

    getBlocks: (level?: string, semester?: string): Promise<unknown[]> => {
        const params = new URLSearchParams();
        if (level) params.set('level', level);
        if (semester && semester !== 'ALL') params.set('semester', semester);
        const q = params.toString() ? `?${params.toString()}` : '';
        return fetch(`${BASE_URL()}/api/admin/blocks${q}`, { headers: adminHeaders() })
            .then(res => handleResponse<unknown[]>(res));
    },

    createBlock: (data: unknown): Promise<{ message: string }> =>
        fetch(`${BASE_URL()}/api/admin/blocks`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify(data),
        }).then(res => handleResponse(res)),

    updateBlock: (blockId: string, semester: string, data: unknown): Promise<{ message: string }> => {
        const query = semester && semester !== 'ALL' ? `?semester=${encodeURIComponent(semester)}` : '';
        return fetch(`${BASE_URL()}/api/admin/blocks/${encodeURIComponent(blockId)}${query}`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify(data),
        }).then(res => handleResponse(res));
    },

    deleteBlock: (blockId: string, semester: string): Promise<{ message: string }> => {
        const query = semester && semester !== 'ALL' ? `?semester=${encodeURIComponent(semester)}` : '';
        return fetch(`${BASE_URL()}/api/admin/blocks/${encodeURIComponent(blockId)}${query}`, {
            method: 'DELETE',
            headers: adminHeaders(),
        }).then(res => handleResponse(res));
    },

    parseSchedulePdf: (file: File): Promise<unknown> => {
        const formData = new FormData();
        formData.append('file', file);
        
        // Note: For FormData, we let the browser set the Content-Type header with the boundary
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        
        return fetch(`${BASE_URL()}/api/admin/blocks/parse-pdf`, {
            method: 'POST',
            headers,
            body: formData,
        }).then(res => handleResponse(res));
    },

    // ── Contact Messages ──────────────────────────────────────────────────────
    getContactMessages: (): Promise<any[]> =>
        fetch(`${BASE_URL()}/api/contact`, { headers: adminHeaders() })
            .then(res => handleResponse<any[]>(res)),
};
