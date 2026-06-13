'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi } from '@/services/adminApi';
import RlJobsTable from '@/components/admin/RlJobsTable';
import RlEngineControls from '@/components/admin/RlEngineControls';
import type { AdminRlJob } from '@/types/admin';

const POLL_INTERVAL_MS = 5000;

export default function AdminRlEnginePage() {
    const [jobs, setJobs] = useState<AdminRlJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ totalStudents: number; triggeredJobs: number } | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadJobs = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const data = await adminApi.getRlJobs();
            setJobs(data);
            return data;
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadJobs(); }, [loadJobs]);

    const hasActiveJobs = jobs.some(j => j.status === 'Queued' || j.status === 'Running');

    useEffect(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        if (!hasActiveJobs) return;

        pollRef.current = setInterval(() => {
            loadJobs(true);
        }, POLL_INTERVAL_MS);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [hasActiveJobs, loadJobs]);

    const handleSyncAll = async (isSimulation: boolean) => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const result = await adminApi.syncAll(isSimulation);
            setSyncResult(result);
            await loadJobs(true);
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleTriggerSingle = async (studentId: string, isSimulation: boolean) => {
        await adminApi.triggerRl(studentId, isSimulation);
        await loadJobs(true);
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            await adminApi.deleteRlJob(jobId);
            await loadJobs(true);
        } catch (e: any) {
            alert(`❌ Failed to delete job: ${e.message}`);
        }
    };

    // Status counts for header
    const counts = jobs.reduce((acc, j) => {
        acc[j.status] = (acc[j.status] ?? 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-header__title">Recommended Courses</h1>
                <p className="admin-page-header__subtitle">
                    Monitor and control AI-driven course recommendations
                </p>
            </div>

            {/* Status pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'Ready',   cls: 'admin-badge--green' },
                    { key: 'Running', cls: 'admin-badge--blue' },
                    { key: 'Queued',  cls: 'admin-badge--amber' },
                    { key: 'Failed',  cls: 'admin-badge--rose' },
                ].map(({ key, cls }) => (
                    <span key={key} className={`admin-badge ${cls}`}>
                        {key}: {counts[key] ?? 0}
                    </span>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Controls column */}
                <div>
                    <RlEngineControls
                        onSyncAll={handleSyncAll}
                        onTriggerSingle={handleTriggerSingle}
                        syncing={syncing}
                        triggerResult={syncResult}
                    />
                </div>

                {/* Jobs table column */}
                <div>
                    {loading ? (
                        <div className="admin-card">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="admin-skeleton" style={{ height: 48, margin: '4px 12px', borderRadius: 8 }} />
                            ))}
                        </div>
                    ) : (
                        <RlJobsTable
                            jobs={jobs}
                            onRefresh={() => loadJobs(true)}
                            refreshing={refreshing}
                            onDeleteJob={handleDeleteJob}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
