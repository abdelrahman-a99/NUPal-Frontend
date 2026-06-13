'use client';

import { RefreshCw, Play, Zap, Trash2 } from 'lucide-react';
import type { AdminRlJob } from '@/types/admin';

const STATUS_BADGE: Record<string, string> = {
    Queued:  'admin-badge admin-badge--amber',
    Running: 'admin-badge admin-badge--blue',
    Ready:   'admin-badge admin-badge--green',
    Failed:  'admin-badge admin-badge--rose',
};

function formatDuration(start?: string, end?: string): string {
    if (!start) return '—';
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const secs = Math.round((e.getTime() - s.getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.round(secs / 60)}m ${secs % 60}s`;
}

interface RlJobsTableProps {
    jobs: AdminRlJob[];
    onRefresh: () => void;
    refreshing: boolean;
    onDeleteJob: (jobId: string) => void;
}

export default function RlJobsTable({ jobs, onRefresh, refreshing, onDeleteJob }: RlJobsTableProps) {
    const sorted = [...jobs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return (
        <div className="admin-card">
            <div className="admin-card__toolbar">
                <h2 className="admin-card__title">Job Queue</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {jobs.some(j => j.status === 'Queued' || j.status === 'Running') && (
                        <span className="admin-badge admin-badge--blue">Processing…</span>
                    )}
                    <button onClick={onRefresh} disabled={refreshing} className="admin-btn admin-btn--ghost admin-btn--sm">
                    <RefreshCw size={14} className={refreshing ? 'admin-spin' : ''} />
                    Refresh
                    </button>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th className="admin-table__th">Student ID</th>
                            <th className="admin-table__th">Status</th>
                            <th className="admin-table__th">Mode</th>
                            <th className="admin-table__th">Created</th>
                            <th className="admin-table__th">Duration</th>
                            <th className="admin-table__th">Recommendation ID</th>
                            <th className="admin-table__th">Error</th>
                            <th className="admin-table__th">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={7} className="admin-table__empty">No jobs found.</td>
                            </tr>
                        )}
                        {sorted.map(job => (
                            <tr key={job.id} className="admin-table__row">
                                <td className="admin-table__td admin-table__td--mono admin-table__td--truncate">
                                    {job.studentId}
                                </td>
                                <td className="admin-table__td">
                                    <span className={STATUS_BADGE[job.status] ?? 'admin-badge'}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="admin-table__td">
                                    {job.isSimulation
                                        ? <span className="admin-badge admin-badge--purple"><Zap size={11} /> Sim</span>
                                        : <span className="admin-badge"><Play size={11} /> Prod</span>}
                                </td>
                                <td className="admin-table__td admin-table__td--muted">
                                    {new Date(job.createdAt).toLocaleString()}
                                </td>
                                <td className="admin-table__td admin-table__td--muted">
                                    {formatDuration(job.startedAt, job.finishedAt)}
                                </td>
                                <td className="admin-table__td admin-table__td--mono admin-table__td--truncate">
                                    {job.resultRecommendationId ?? '—'}
                                </td>
                                <td className="admin-table__td admin-table__td--error">
                                    {job.error ?? '—'}
                                </td>
                                <td className="admin-table__td">
                                    <button 
                                        className="admin-btn admin-btn--ghost admin-btn--sm" 
                                        style={{ color: 'var(--adm-rose)' }}
                                        onClick={() => onDeleteJob(job.id)}
                                        title="Delete Job"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
