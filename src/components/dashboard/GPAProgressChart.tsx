'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface SemesterData {
    term: string;
    semesterGpa: number;
    cumulativeGpa: number;
}

interface GPAProgressChartProps {
    data: {
        education: {
            semesters: SemesterData[];
        };
    };
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-slate-900 dark:text-slate-100 font-bold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">{entry.name}:</span>
                        <span className="text-slate-900 dark:text-slate-100 text-sm font-bold">{entry.value.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function GPAProgressChart({ data }: GPAProgressChartProps) {
    let chartData = data?.education?.semesters || [];

    // If only one semester, pad data to show a horizontal line instead of a single dot
    const isSingleSemester = chartData.length === 1;
    if (isSingleSemester) {
        const single = chartData[0];
        chartData = [
            { ...single, term: ' ' }, // Left buffer
            single,                   // Actual data
            { ...single, term: '  ' } // Right buffer
        ];
    }

    // Calculate dynamic min to make fluctuations more visible, but keep max at 4.0 for motivation
    const allGpas = chartData.flatMap(s => [s.semesterGpa, s.cumulativeGpa]);
    const minGpa = Math.floor(Math.min(...allGpas) * 10) / 10 - 0.2;
    const finalMin = Math.max(0, minGpa);
    const finalMax = 4.0; // Always keep the goal visible

    // Generate ticks that increment by 0.25
    const generateTicks = () => {
        const ticks = [];
        // Round finalMin down to nearest 0.25
        const startTick = Math.floor(finalMin * 4) / 4;
        // Generate ticks from startTick to finalMax in 0.25 increments
        for (let i = startTick; i <= finalMax; i += 0.25) {
            ticks.push(Math.round(i * 100) / 100); // Round to avoid floating point errors
        }
        return ticks;
    };

    return (
        <div className="w-full h-full outline-none focus:outline-none ring-0">
            <style jsx global>{`
                .recharts-wrapper,
                .recharts-surface,
                .recharts-layer,
                .recharts-cartesian-grid,
                .recharts-layer path,
                .recharts-dot {
                    outline: none !important;
                    box-shadow: none !important;
                }
                *:focus {
                    outline: none !important;
                }
            `}</style>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorSemester" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFFFFF" opacity={0.1} />
                    <XAxis
                        dataKey="term"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', opacity: 0.8, fontSize: 10, fontWeight: 600 }}
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={[finalMin, finalMax]}
                        allowDecimals={true}
                        ticks={generateTicks()}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', opacity: 0.8, fontSize: 10, fontWeight: 600 }}
                        dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        content={(props) => {
                            const { payload } = props;
                            return (
                                <div className="flex justify-center items-center gap-6 pb-6">
                                    {payload?.map((entry: any, index: number) => (
                                        <div key={`item-${index}`} className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <span className="text-white/90 dark:text-white/90 font-bold text-[10px]">
                                                {entry.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        }}
                    />
                    <Line
                        name="Semester GPA"
                        type="monotone"
                        dataKey="semesterGpa"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                    />
                    <Line
                        name="Cumulative GPA"
                        type="monotone"
                        dataKey="cumulativeGpa"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
