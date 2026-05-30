import { CalendarDays } from 'lucide-react';

type Tab = 'my-schedule' | 'blocks-explorer' | 'assistant';

export default function SchedulingHeader({
    activeTab,
    setActiveTab,
    TABS,
}: {
    activeTab: Tab;
    setActiveTab: (t: Tab) => void;
    TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[];
}) {
    return (
        <div className="relative overflow-hidden pb-2 pt-10 mb-0">
            {/* Decorative background blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-50/80 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 w-64 h-64 rounded-full bg-indigo-50/60 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="mb-6 flex flex-col items-center text-center">
                    <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                        <CalendarDays className="h-9 w-9 text-[#2F80ED] drop-shadow-sm" strokeWidth={2.5} />
                        Build your perfect <span className="text-[#2F80ED]">schedule</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-3 text-base max-w-lg leading-relaxed">
                        Explore available blocks, customize your courses, and let AI build your conflict-free timetable.
                    </p>
                </div>

                <div className="flex justify-center z-20 relative">
                    <div className="inline-flex overflow-x-auto hide-scrollbar bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner max-w-full">
                        {TABS.map(({ id, label, icon: Icon }) => {
                            const active = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`relative flex items-center whitespace-nowrap gap-2.5 px-6 py-3 text-sm font-bold transition-all duration-300 rounded-xl ${active
                                        ? 'bg-white dark:bg-slate-900 text-[#2F80ED] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-200/50'
                                        }`}
                                >
                                    <Icon size={18} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

