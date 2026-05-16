import React from 'react';

interface DashboardCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
}

export default function DashboardCard({
    title,
    value,
    subtitle
}: DashboardCardProps) {
    return (
        <div className="w-full p-6 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center text-center h-full">
            <div className="flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
                <span className="text-slate-900 dark:text-slate-100 text-3xl font-bold">{value}</span>
                {subtitle && (
                    <span className="text-slate-400 dark:text-slate-400 text-[10px] mt-1 italic">{subtitle}</span>
                )}
            </div>
        </div>
    );
}
