import {
  ChevronLeft, Target, Zap, Sparkles, CheckCircle2,
  BarChart3, HelpCircle, BookOpen, AlertCircle, Trash2
} from 'lucide-react';
import { JobFitAnalysisData } from '../../../app/career-hub/resume-analyzer/types';

interface JobFitReportProps {
  data: JobFitAnalysisData & { id?: string };
  onBack: () => void;
  onDelete?: (id: string) => void;
  onStartInterviewPrep?: () => void;
}

export function JobFitReport({ data, onBack, onDelete, onStartInterviewPrep }: JobFitReportProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header - Matching User's Preference (No Blue Box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full md:w-auto">
          <div className="flex items-center gap-5">
            <button onClick={onBack} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 group">
              <ChevronLeft className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100/50">Analysis Report</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {data.jobTitle || 'Role Analysis'}
              </h1>
              <p className="text-sm text-slate-950 dark:text-slate-100 font-bold uppercase tracking-wider opacity-60">
                {data.companyName || 'Company'} Profile Match
              </p>
            </div>
          </div>
          {/* Action Area for Report-specific controls could go here if needed in the future */}
        </div>

        {/* Score - Redesigned (Circular Bubble) */}
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48" cy="48" r="40"
              className="stroke-slate-100 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="48" cy="48" r="40"
              className="stroke-blue-600 fill-none"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.overallScore / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data.overallScore}%</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-950 dark:text-slate-100">Match</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-3">

          {/* Analysis Summary */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-300"><Zap className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Analysis Summary</h2>
            </div>
            <p className="text-slate-950 dark:text-slate-100 leading-relaxed font-semibold text-[15px]">
              {data.detailedSummary}
            </p>
          </section>

          {/* Red Flags — always show section; empty means model found no separate deal-breakers */}
          <section
            className={`p-6 rounded-2xl border shadow-sm ${data.redFlags && data.redFlags.length > 0
              ? 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50'
              : 'bg-slate-50 dark:bg-slate-900/70 border-slate-100 dark:border-slate-800'
              }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`shrink-0 p-2 rounded-lg ${data.redFlags && data.redFlags.length > 0 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : 'bg-slate-200/80 text-slate-950 dark:text-slate-100'
                  }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2
                  className={`text-sm font-bold uppercase tracking-widest ${data.redFlags && data.redFlags.length > 0 ? 'text-red-600 dark:text-red-300' : 'text-slate-950 dark:text-slate-100'
                    }`}
                >
                  Critical Concerns (Red Flags)
                </h2>
              </div>
            </div>
            {data.redFlags && data.redFlags.length > 0 ? (
              <ul className="space-y-3">
                {data.redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-3 text-red-700 dark:text-red-300 text-sm font-bold">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-medium text-slate-950 dark:text-slate-100 leading-relaxed">
                No separate critical concerns were listed for this run — check{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">Experience Match</span> in the breakdown for seniority fit. Other gaps may appear under{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">Opportunities</span> and{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">Missing Keywords</span>.
              </p>
            )}
          </section>

          {/* Detailed Breakdown - Redesigned as Boxes */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-300"><BarChart3 className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Match Breakdown</h2>
                <p className="text-xs text-slate-950 dark:text-slate-100 font-semibold mt-0.5">Categorized breakdown of your alignment with the role</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills Alignment Box */}
              <div className="group bg-slate-50/60 dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Skills Alignment</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">Technical Coverage</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-300 leading-none">{data.breakdown.skills}%</span>
                      <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${data.breakdown.skills}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-950 dark:text-slate-100 font-medium leading-relaxed">{data.breakdown.skillsNote || 'Comprehensive review of technical keywords and proficiency.'}</p>
                </div>
              </div>

              {/* Experience Alignment Box */}
              <div className="group bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-900/[0.02] border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Experience Match</h4>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">Professional Tenure</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{data.breakdown.experience}%</span>
                      <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${data.breakdown.experience}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-950 dark:text-slate-100 font-medium leading-relaxed">{data.breakdown.experienceNote}</p>
                </div>
              </div>

              {/* Matched Keywords Box */}
              <div className="group bg-blue-50/30 hover:bg-blue-50/60 border border-blue-100/50 hover:border-blue-200 rounded-2xl p-6 transition-all duration-200 dark:bg-blue-400/10 dark:hover:bg-blue-400/15 dark:border-blue-400/25 dark:hover:border-blue-400/35">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-[0.15em]">Matched Keywords</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.breakdown.matchedSkills.filter(s => s && typeof s === 'object' && s.skill).map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-[#1E2F4D] border border-blue-100 dark:border-blue-400/25 text-blue-700 dark:text-blue-200 text-[11px] font-bold rounded-xl shadow-sm dark:shadow-none hover:scale-105 transition-transform cursor-default">
                      {s.skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords Box */}
              {data.breakdown.missingSkills?.filter(s => s && typeof s === 'object' && s.skill).length > 0 && (
                <div className="group bg-red-50/30 hover:bg-red-50/60 border border-red-100/50 hover:border-red-200 rounded-2xl p-6 transition-all duration-200 dark:bg-rose-400/10 dark:hover:bg-rose-400/15 dark:border-rose-400/25 dark:hover:border-rose-400/35">
                  <div className="flex items-center gap-2 mb-5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-[0.15em]">Missing Keywords</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.breakdown.missingSkills.filter(s => s && typeof s === 'object' && s.skill).map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white dark:bg-[#1E2F4D] border border-red-100 dark:border-rose-400/25 text-red-600 dark:text-rose-200 text-[11px] font-bold rounded-xl shadow-sm dark:shadow-none hover:scale-105 transition-transform cursor-default">
                        {s.skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Career Recommendations - Redesigned as numbered detail cards */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-300"><BookOpen className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Career Recommendations</h2>
                <p className="text-xs text-slate-950 dark:text-slate-100 font-semibold mt-0.5">Personalized action plan based on your profile</p>
              </div>
            </div>
            <div className="space-y-5">
              {data.recommendations.map((rec, i) => {
                // Extract URLs from the recommendation text
                const urlRegex = /https?:\/\/[^\s)]+?(?=[.,!?;:]*(\s|$|\)))/g;
                const urls = rec.match(urlRegex) || [];
                // Remove URLs and empty parentheses from display text
                let textWithoutUrls = rec.replace(urlRegex, '').trim();
                // Remove any remaining empty parentheses ()
                textWithoutUrls = textWithoutUrls.replace(/\s*\(\s*\)/g, '');

                return (
                  <div key={i} className="group flex gap-5 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900/50 rounded-2xl p-5 transition-all duration-200">
                    {/* Step number */}
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-slate-800 dark:text-slate-100 font-bold leading-relaxed whitespace-pre-wrap">
                        {textWithoutUrls}
                      </p>
                      {urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                              Open Resource
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>




        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Highlights & Opportunities - Moved to Sidebar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-300">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg"><Sparkles className="w-4 h-4" /></div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-950 dark:text-slate-100">Key Highlights</h3>
              </div>
              <ul className="space-y-3">
                {data.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-300">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg"><Target className="w-4 h-4" /></div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-950 dark:text-slate-100">Opportunities</h3>
              </div>
              <ul className="space-y-3">
                {data.opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-snug">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-300"><HelpCircle className="w-5 h-5" /></div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">Interview Focus</h3>
              </div>
              <div className="space-y-2">
                {data.interviewFocus.slice(0, 4).map((f, i) => (
                  <div key={i} className="text-[11px] font-bold text-slate-900 dark:text-slate-100 p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" /> {f}
                  </div>
                ))}
              </div>

              {onStartInterviewPrep && (
                <button
                  onClick={onStartInterviewPrep}
                  className="group relative w-full sm:w-fit mx-auto mt-6 mb-2 flex items-center justify-center gap-3 py-3 px-8 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-[0.1em] overflow-hidden transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98]"
                >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <Sparkles className="w-4 h-4 text-blue-400 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <span>Practice Interview for this job</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
