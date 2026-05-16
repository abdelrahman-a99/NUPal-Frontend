import React from 'react';
import { Target, Link as LinkIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface JobFitCheckProps {
  jobUrl: string;
  setJobUrl: (url: string) => void;
  handleJobFit: () => void;
  fitLoading: boolean;
  historyLength: number;
}

export function JobFitCheck({ 
  jobUrl, 
  setJobUrl, 
  handleJobFit, 
  fitLoading, 
  historyLength 
}: JobFitCheckProps) {
  return (
    <section className="max-w-2xl mx-auto mt-12">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-300">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Check Job Fit</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6">
          Paste a link to any job post (LinkedIn, Wuzzuf, etc.) to see how well you match.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 font-black" />
            <input 
              type="url"
              placeholder="https://www.linkedin.com/jobs/..."
              className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>
          <button 
            onClick={handleJobFit}
            disabled={!jobUrl || fitLoading || historyLength === 0}
            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-w-[140px]"
          >
            {fitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {fitLoading ? 'Analyzing...' : 'Analyze Fit'}
          </button>
        </div>
        {historyLength === 0 && !fitLoading && (
          <p className="mt-3 text-[10px] text-amber-600 dark:text-amber-300 font-black uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> Upload a resume first to use this feature
          </p>
        )}
      </div>
    </section>
  );
}
