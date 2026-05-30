import { ChevronLeft, ChevronRight, Info, Layers, Loader2, Search } from 'lucide-react';
import { Block } from '@/types/scheduling';
import BlockCard from '@/components/scheduling/BlockCard';

function BlockSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 mb-3 shadow-sm animate-pulse">
            <div className="flex items-start mb-2.5">
                <div className="flex-1">
                    <div className="h-5 bg-slate-100 rounded-md w-1/3 mb-2" />
                    <div className="flex items-center gap-2.5">
                        <div className="h-3 bg-slate-100 rounded w-16" />
                        <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
                <div className="h-5 bg-slate-50 rounded-full w-10 border border-slate-100" />
                <div className="h-5 bg-slate-50 rounded-full w-10 border border-slate-100" />
                <div className="h-5 bg-slate-50 rounded-full w-10 border border-slate-100" />
            </div>
            <div className="h-10 bg-blue-50/50 rounded-xl w-full border border-blue-50" />
        </div>
    );
}

export default function BlocksExplorerTab({
    filteredBlocks,
    paginatedBlocks,
    blocksLoading,
    blockLevelTab,
    setBlockLevelTab,
    blockQuery,
    setBlockQuery,
    totalBlockPages,
    blockCurrentPage,
    setBlockCurrentPage,
    activeSemester,
}: {
    filteredBlocks: Block[];
    paginatedBlocks: Block[];
    blocksLoading: boolean;
    blockLevelTab: 'FR' | 'JR' | 'SO' | 'SR' | 'ALL';
    setBlockLevelTab: React.Dispatch<React.SetStateAction<'FR' | 'JR' | 'SO' | 'SR' | 'ALL'>>;
    blockQuery: string;
    setBlockQuery: React.Dispatch<React.SetStateAction<string>>;
    totalBlockPages: number;
    blockCurrentPage: number;
    setBlockCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    activeSemester: string | null;
}) {
    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 pl-0 md:pl-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center shrink-0">
                        <Layers size={18} className="text-[#2F80ED]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 text-slate-900">
                            <h2 className="text-lg font-bold leading-tight">Blocks Explorer</h2>
                            <div className="relative group flex items-center mt-0.5 ml-1">
                                <Info size={16} className="text-slate-400 hover:text-blue-500 cursor-default transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white text-slate-600 text-[13px] leading-relaxed p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                    Browse all available blocks for the semester. You can search by block name or specific course ID to filter the list instantly.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[13px] font-medium text-slate-500">
                            <span className="text-slate-700 font-semibold">{filteredBlocks.length} <span className="font-medium text-slate-500">block{filteredBlocks.length !== 1 ? 's' : ''} {blockLevelTab !== 'ALL' ? `for ${blockLevelTab}` : 'total'}</span></span>
                            {activeSemester && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-blue-500 font-bold">{activeSemester}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    {/* Level Tabs - Minimal Scroll-style */}
                    <div className="flex items-center justify-center sm:justify-start gap-5 overflow-x-auto py-1 scrollbar-none">
                        {(['FR', 'SO', 'JR', 'SR', 'ALL'] as const).map((lvl) => {
                            const isActive = blockLevelTab === lvl;
                            return (
                                <button
                                    key={lvl}
                                    onClick={() => setBlockLevelTab(lvl)}
                                    className={`relative py-1.5 text-sm font-bold transition-all shrink-0 ${isActive
                                        ? 'text-[#2F80ED]'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {lvl === 'ALL' ? 'All' : lvl}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F80ED] rounded-full animate-in fade-in zoom-in-95 duration-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-full md:w-64">
                        <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all">
                            <Search size={14} className="text-slate-400" />
                            <input
                                type="text"
                                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                                placeholder="Quick search..."
                                value={blockQuery}
                                onChange={e => setBlockQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {blocksLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...Array(9)].map((_, i) => (
                        <BlockSkeleton key={i} />
                    ))}
                </div>
            ) : filteredBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                    <div className="mb-6 text-[#94a3b8]">
                        <Layers size={80} strokeWidth={1.2} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0f172a] tracking-tight">No matching blocks</h3>
                </div>
            ) : (
                <div className="flex flex-col min-h-[620px]">
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {paginatedBlocks.map(block => (
                                <BlockCard key={`${block.blockId}-${block.semester}`} block={block} />
                            ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalBlockPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-8">
                            <button
                                onClick={() => setBlockCurrentPage(p => Math.max(1, p - 1))}
                                disabled={blockCurrentPage === 1}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-1.5 mx-2">
                                {[...Array(totalBlockPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    const isCurrent = blockCurrentPage === pageNum;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setBlockCurrentPage(() => pageNum)}
                                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${isCurrent
                                                ? 'bg-[#2F80ED] text-white shadow-md shadow-blue-200'
                                                : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300 hover:text-slate-800'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setBlockCurrentPage(p => Math.min(totalBlockPages, p + 1))}
                                disabled={blockCurrentPage === totalBlockPages}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

