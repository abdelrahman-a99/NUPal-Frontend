import React from 'react';
import { Job } from '../../services/jobService';
import { MapPin, Building2, Clock, Calendar, ExternalLink, DollarSign } from 'lucide-react';

interface JobCardProps {
    job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    };

    // Format salary
    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;
        if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
        if (min) return `From $${min.toLocaleString()}`;
        if (max) return `Up to $${max.toLocaleString()}`;
        return null;
    };

    return (
        <div className="group relative flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 transition-all duration-200 hover:border-blue-400 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-400 font-bold text-xl uppercase">
                        {job.companyName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                            <a href={job.redirectUrl} target="_blank" rel="noopener noreferrer" className="before:absolute before:inset-0">
                                {job.title}
                            </a>
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <Building2 className="mr-1 h-3.5 w-3.5" />
                            <span className="line-clamp-1">{job.companyName}</span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="mr-1 h-3.5 w-3.5" />
                            <span className="line-clamp-1">{job.location}</span>
                        </div>

                        <div className="mt-3 mb-2 line-clamp-2 text-[13px] text-slate-500 dark:text-slate-400 max-w-3xl">
                            {job.description.replace(/<strong>|<\/strong>/g, '')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {job.contractTime && (
                    <span className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-600 dark:text-slate-300">
                        <Clock className="mr-1 h-3 w-3" />
                        {job.contractTime.split(/[_\s-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                )}
                {job.workType && (
                    <span className={`flex items-center rounded-md px-2 py-1 ${job.workType.toLowerCase() === 'remote' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600' :
                        job.workType.toLowerCase() === 'hybrid' ? 'bg-orange-50 text-orange-600' :
                            'bg-gray-50 dark:bg-slate-900/70 text-gray-600 dark:text-slate-300'
                        }`}>
                        <MapPin className="mr-1 h-3 w-3" />
                        {job.workType.charAt(0).toUpperCase() + job.workType.slice(1)}
                    </span>
                )}
                {job.created && (
                    <span className="flex items-center rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-1 text-blue-600 dark:text-blue-300">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(job.created)}
                    </span>
                )}
                {formatSalary(job.salaryMin, job.salaryMax) && (
                    <span className="flex items-center rounded-md bg-green-50 dark:bg-emerald-950/40 px-2 py-1 text-green-700 dark:text-emerald-300">
                        <DollarSign className="mr-1 h-3 w-3" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                )}
            </div>

            <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                <ExternalLink className="h-5 w-5 text-slate-400 dark:text-slate-400" />
            </div>
        </div>
    );
};
