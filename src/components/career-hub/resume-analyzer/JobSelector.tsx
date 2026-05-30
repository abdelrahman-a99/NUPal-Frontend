import React, { useRef, useEffect, useState } from 'react';
import { Building2, Calendar, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { JobFitHistoryItem } from '@/services/resumeService';

interface JobSelectorProps {
  history: JobFitHistoryItem[];
  selectedId?: string;
  onSelect: (item: JobFitHistoryItem) => void;
  isLoading?: boolean;
}

export function JobSelector({ history, selectedId, onSelect, isLoading }: JobSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = history.find(i => i.id === selectedId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full mb-3" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsOpen(v => !v)}
        className={`w-full flex items-center gap-2 rounded-2xl border bg-white dark:bg-slate-900 px-3 py-2 text-left transition-all focus:outline-none
          ${isOpen ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'}
          ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 dark:text-slate-400 shrink-0" />
        ) : (
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400'}`}>
            {selected ? selected.jobTitle?.charAt(0).toUpperCase() : <Building2 className="h-3.5 w-3.5" />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
            {selected ? (
              <>{selected.jobTitle} {selected.companyName && <span className="text-[11px] font-bold tracking-normal text-slate-500 dark:text-slate-400 uppercase ml-2 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800">· {selected.companyName}</span>}</>
            ) : (
              <span className="text-slate-400 dark:text-slate-400">{isLoading ? 'Loading history…' : 'Choose a role from your match history'}</span>
            )}
          </p>
        </div>

        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
          {history.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No match history found.</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-400">Analyze a job first</p>
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {history.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => { onSelect(item); setIsOpen(false); }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-colors
                          ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                        `}
                      >
                        {item.jobTitle?.charAt(0).toUpperCase() ?? '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-[13px] font-bold uppercase tracking-tight leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900 dark:text-slate-100'}`}>
                          {item.jobTitle || 'Untitled Role'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {item.companyName && <span className="truncate">{item.companyName}</span>}
                          <span className="flex items-center gap-1 shrink-0 ml-auto text-[10px] text-slate-400 dark:text-slate-400">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(item.analyzedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Check */}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
