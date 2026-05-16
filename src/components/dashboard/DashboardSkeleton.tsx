import Skeleton from '../ui/Skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            {/* Desktop Skeleton */}
            <div className="hidden md:block">
                <div className="relative bg-slate-50 dark:bg-slate-900/70 pt-16 pb-32 px-6 md:px-10 overflow-hidden">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-6 w-80" />
                        </div>
                    </div>
                </div>

                <div className="px-6 md:px-10 -mt-6 relative z-20">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex p-6 gap-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="max-w-screen-xl mx-auto mt-32 px-10">
                        <div className="flex gap-12">
                            <div className="w-64 space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                            <div className="flex-1 space-y-16">
                                {[1, 2].map((i) => (
                                    <div key={i} className="rounded-[2rem] bg-slate-50 dark:bg-slate-900/70 p-14 min-h-[420px] space-y-6">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Skeleton */}
            <div className="md:hidden pb-10 bg-slate-50 dark:bg-slate-900/70">
                <div className="bg-white dark:bg-slate-900 px-6 pt-6 pb-6 rounded-b-3xl shadow-sm space-y-6">
                    <div className="flex justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-10 w-10 circle" variant="circle" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>

                <div className="px-5 mt-6 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-[380px] w-full rounded-2xl" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-sm space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-80 w-full rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-[1.5rem]" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
