import Skeleton from '../ui/Skeleton';

export default function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 overflow-hidden">
            {/* Hero Skeleton - Abstract placeholder for the background */}
            <section className="relative w-full py-20 min-h-[75vh] flex items-center overflow-hidden bg-slate-50 dark:bg-slate-900/70">
                {/* Abstract "image" placeholder using gradients and shimmers */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-blue-100/30 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[80%] bg-indigo-50/50 blur-[80px] rounded-full animate-shimmer" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-slate-950 via-white/40 to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
                    <div className="max-w-3xl space-y-10">
                        <div className="space-y-4">
                            <Skeleton className="h-14 w-[85%] sm:h-20 rounded-2xl" />
                            <Skeleton className="h-14 w-[60%] sm:h-20 rounded-2xl" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-full rounded-full" />
                            <Skeleton className="h-6 w-[90%] rounded-full" />
                            <Skeleton className="h-6 w-[70%] rounded-full" />
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row pt-6">
                            <Skeleton className="h-12 w-40 rounded-full" />
                            <Skeleton className="h-12 w-40 rounded-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Skeleton - Centered Pills & Grid */}
            <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex flex-wrap justify-center gap-4 mb-16">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-10 w-28 rounded-full" />
                        ))}
                    </div>
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        <div className="space-y-0">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="border-b border-slate-100 dark:border-slate-800 py-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                        <Skeleton className="h-8 w-48 rounded-lg" />
                                    </div>
                                    <div className="pl-8 space-y-2">
                                        <Skeleton className="h-4 w-full rounded-full" />
                                        <Skeleton className="h-4 w-[80%] rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden lg:block relative">
                            <div className="absolute -inset-4 bg-blue-50/30 rounded-3xl -z-10" />
                            <Skeleton className="aspect-[4/3] w-full rounded-2xl shadow-xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Skeleton - Horizontal Scroll Look */}
            <section className="py-24 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-64 rounded-xl" />
                            <Skeleton className="h-6 w-full max-w-xl rounded-full" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                    </div>
                    <div className="flex gap-8 overflow-hidden pointer-events-none">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-shrink-0 w-[320px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                                <Skeleton className="h-4 w-24 rounded-full" />
                                <div className="space-y-3">
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                    <Skeleton className="h-10 w-2/3 rounded-xl" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full rounded-full" />
                                    <Skeleton className="h-4 w-full rounded-full" />
                                    <Skeleton className="h-4 w-[60%] rounded-full" />
                                </div>
                                <Skeleton className="h-10 w-32 rounded-xl mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
