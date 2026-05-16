'use client';

import { useEffect, useState } from 'react';
import { Skill } from '@/services/dynamicSkillsService';

interface SkillCardProps {
    skill: Skill;
    index: number;
}

export function SkillCard({ skill, index }: SkillCardProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), index * 100);
        return () => clearTimeout(timer);
    }, [index]);

    // Calculate stroke dashoffset for circular progress
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (skill.level / 100) * circumference;

    return (
        <div
            className={`group relative transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
        >
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Content */}
                <div className="relative flex flex-col items-center gap-3">
                    {/* Circular Progress */}
                    <div className="relative h-24 w-24">
                        <svg className="h-24 w-24 -rotate-90 transform">
                            {/* Background circle */}
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                stroke="#e2e8f0"
                                strokeWidth="8"
                                fill="none"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                stroke="url(#gradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#60a5fa" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {/* Percentage text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{skill.level}%</span>
                        </div>
                    </div>

                    {/* Skill name */}
                    <h3 className="text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {skill.name}
                    </h3>

                    {/* Category badge */}
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                        {skill.category}
                    </span>
                </div>

                {/* Shine effect on hover */}
                <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </div>
        </div>
    );
}

interface SkillsDisplayProps {
    skills: Skill[];
}

export function SkillsDisplay({ skills }: SkillsDisplayProps) {
    if (!skills || skills.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
                {skills.slice(0, 4).map((skill, index) => (
                    <SkillCard key={skill.name} skill={skill} index={index} />
                ))}
            </div>
        </div>
    );
}
