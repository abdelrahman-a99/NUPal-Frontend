'use client';

import { useEffect, useState } from 'react';
import { Users, Brain, BookOpen, Layers, TrendingUp } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import AdminSelect from '@/components/admin/AdminSelect';
import StatCard from '@/components/admin/StatCard';
import type { AdminSystemStats } from '@/types/admin';

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<AdminSystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingSemester, setUpdatingSemester] = useState(false);

    useEffect(() => {
        adminApi.getStats()
            .then(setStats)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSemesterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSemester = e.target.value;
        if (!newSemester) return;
        
        setUpdatingSemester(true);
        try {
            await adminApi.updateActiveSemester(newSemester);
            setStats(prev => prev ? { ...prev, activeSemester: newSemester } : null);
        } catch (err: any) {
            alert('Failed to update active semester: ' + err.message);
        } finally {
            setUpdatingSemester(false);
        }
    };

    if (loading || !stats) {
        return (
            <div>
                <div className="admin-page-header">
                    <div className="admin-skeleton" style={{ height: 32, width: '200px', marginBottom: 8 }} />
                    <div className="admin-skeleton" style={{ height: 16, width: '300px' }} />
                </div>
                
                <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="admin-stat-card">
                            <div className="admin-skeleton" style={{ height: 42, width: 42, borderRadius: 10 }} />
                            <div className="flex-1 space-y-2">
                                <div className="admin-skeleton" style={{ height: 12, width: '60%' }} />
                                <div className="admin-skeleton" style={{ height: 24, width: '40%' }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="admin-card" style={{ height: '240px', padding: '1.5rem' }}>
                            <div className="admin-skeleton" style={{ height: 20, width: '40%', marginBottom: '1.5rem' }} />
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="admin-skeleton" style={{ height: 12, width: '80px' }} />
                                        <div className="admin-skeleton" style={{ height: 12, flex: 1 }} />
                                        <div className="admin-skeleton" style={{ height: 12, width: '30px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    } if (error) return <div className="admin-loading">❌ {error}</div>;
    if (!stats) return null;

    const jobReady = stats.rlJobs.byStatus['Ready'] ?? 0;
    const jobFailed = stats.rlJobs.byStatus['Failed'] ?? 0;
    const jobRunning = stats.rlJobs.byStatus['Running'] ?? 0;
    const jobQueued = stats.rlJobs.byStatus['Queued'] ?? 0;
    const levelDist = stats.students.levelDistribution || {};
    const maxDist = Math.max(...Object.values(levelDist), 1);
    const schedulePercent = stats.students.total > 0
        ? Math.round(((stats.students.studentsWithSchedules || 0) / stats.students.total) * 100)
        : 0;

    const categoryDist = stats.courseMappings?.categoryDistribution || {};
    const maxCategoryDist = Math.max(...Object.values(categoryDist), 1);

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-header__title">Dashboard Overview</h1>
                <p className="admin-page-header__subtitle">Platform-wide statistics at a glance</p>
            </div>

            {/* Stat Cards */}
            <div className="admin-stats-grid">
                <StatCard
                    title="Total Students"
                    value={stats.students.total}
                    subtitle={`Avg. GPA ${stats.students.averageGpa}`}
                    icon={<Users size={20} />}
                    accent="blue"
                />
                <StatCard
                    title="Advising Ready"
                    value={`${schedulePercent}%`}
                    subtitle={`${stats.students.studentsWithSchedules} students`}
                    icon={<TrendingUp size={20} />}
                    accent="green"
                />
                <StatCard
                    title="RL Jobs"
                    value={stats.rlJobs.total}
                    subtitle={`${jobReady} ready · ${jobFailed} failed`}
                    icon={<Brain size={20} />}
                    accent={jobFailed > 0 ? 'rose' : 'purple'}
                />
                <StatCard
                    title="Course Mappings"
                    value={stats.courseMappings.total}
                    icon={<BookOpen size={20} />}
                    accent="amber"
                />
                <StatCard
                    title="Scheduling Blocks"
                    value={stats.schedulingBlocks.total}
                    icon={<Layers size={20} />}
                    accent="blue"
                />
            </div>

            {/* Two-column detail */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Level Distribution */}
                <div className="admin-card">
                    <div className="admin-card__toolbar">
                        <h2 className="admin-card__title">Academic Standing</h2>
                    </div>
                    <div className="admin-gpa-dist">
                        {[
                            'Freshman (0-35)',
                            'Sophomore (36-70)',
                            'Junior (71-105)',
                            'Senior (106-135)'
                        ].map(label => {
                            const count = levelDist[label] || 0;
                            return (
                                <div key={label} className="admin-gpa-row">
                                    <span className="admin-gpa-row__label">{label}</span>
                                    <div className="admin-gpa-row__bar-wrap">
                                        <div
                                            className="admin-gpa-row__bar"
                                            style={{ width: `${(count / maxDist) * 100}%` }}
                                        />
                                    </div>
                                    <span className="admin-gpa-row__count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>


                <div className="admin-card">
                    <div className="admin-card__toolbar">
                        <h2 className="admin-card__title">Recommendation Job Status</h2>
                    </div>
                    <div className="admin-gpa-dist">
                        {[
                            { label: 'Ready', count: jobReady, accent: 'admin-badge--green' },
                            { label: 'Running', count: jobRunning, accent: 'admin-badge--blue' },
                            { label: 'Queued', count: jobQueued, accent: 'admin-badge--amber' },
                            { label: 'Failed', count: jobFailed, accent: 'admin-badge--rose' },
                        ].map(row => (
                            <div key={row.label} className="admin-gpa-row">
                                <span className="admin-gpa-row__label">
                                    <span className={`admin-badge ${row.accent}`}>{row.label}</span>
                                </span>
                                <div className="admin-gpa-row__bar-wrap">
                                    <div className="admin-gpa-row__bar" style={{ width: `${(row.count / Math.max(stats.rlJobs.total, 1)) * 100}%` }} />
                                </div>
                                <span className="admin-gpa-row__count">{row.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Course Categories */}
                <div className="admin-card">
                    <div className="admin-card__toolbar">
                        <h2 className="admin-card__title">Course Categories</h2>
                    </div>
                    <div className="admin-gpa-dist">
                        {Object.entries(categoryDist).length > 0 ? (
                            Object.entries(categoryDist).map(([label, count]) => (
                                <div key={label} className="admin-gpa-row">
                                    <span className="admin-gpa-row__label">{label}</span>
                                    <div className="admin-gpa-row__bar-wrap">
                                        <div
                                            className="admin-gpa-row__bar"
                                            style={{ width: `${(count / maxCategoryDist) * 100}%`, backgroundColor: 'var(--adm-accent-amber)' }}
                                        />
                                    </div>
                                    <span className="admin-gpa-row__count">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', color: 'var(--adm-text-muted)', textAlign: 'center' }}>
                                No categories found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Blocks Semester */}
                <div className="admin-card">
                    <div className="admin-card__toolbar">
                        <h2 className="admin-card__title">Active Blocks Semester</h2>
                        <span className="admin-page-header__subtitle">
                            Controls which semester&apos;s blocks are visible to students for recommendations.
                        </span>
                    </div>
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--adm-text-muted)' }}>
                            Select the active semester to be used by the scheduling engine:
                        </label>
                        <AdminSelect
                            value={stats.activeSemester || ''}
                            options={stats.availableSemesters?.map(s => ({ value: s, label: s })) || []}
                            onChange={(val) => handleSemesterChange({ target: { value: val } } as any)}
                            width="100%"
                        />
                        {updatingSemester && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--adm-accent-blue)' }}>
                                Updating active semester...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
