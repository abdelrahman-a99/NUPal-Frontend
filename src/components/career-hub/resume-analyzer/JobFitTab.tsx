import { Target, Link, Upload, Info, CheckCircle2, FileText } from 'lucide-react';
import { ResumeHistoryItem } from '@/services/resumeService';

interface JobFitTabProps {
  jobUrl: string;
  setJobUrl: (url: string) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  activeTab: 'url' | 'text';
  setActiveTab: (tab: 'url' | 'text') => void;
  history: ResumeHistoryItem[];
  selectedResumeId: string | null;
  setSelectedResumeId: (id: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  canAnalyze: boolean;
}

export function JobFitTab({
  jobUrl, setJobUrl,
  jobDescription, setJobDescription,
  activeTab, setActiveTab,
  history, selectedResumeId, setSelectedResumeId,
  onAnalyze, isAnalyzing, canAnalyze
}: JobFitTabProps) {

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 animate-in fade-in duration-500 w-full max-w-5xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Job Information</h2>
      </div>

      <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-2xl w-full mb-6">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'url' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-950 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <Link className="w-4 h-4" />
          Web Link / URL
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'text' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-950 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
        >
          <Upload className="w-4 h-4" />
          Paste Description
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'url' ? (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Job Page URL</label>
              <input
                type="url"
                placeholder="Paste LinkedIn, Indeed, or any job link here..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-slate-950 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm placeholder:font-medium placeholder:text-slate-950"
              />
              <p className="text-xs font-semibold text-slate-950 dark:text-slate-100 ml-1 mt-2">We'll automatically extract the job description from the URL</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Job Description</label>
              <textarea
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-slate-950 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm placeholder:font-medium placeholder:text-slate-950 min-h-[100px] resize-none"
              />
              <p className="text-xs font-semibold text-slate-950 dark:text-slate-100 ml-1 mt-2">Paste the text of the job requirements directly</p>
            </div>
          )}

          <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Analysis Info</h4>
                <p className="text-[11px] font-semibold text-blue-700/70 leading-relaxed">
                  Our AI will analyze the requirements and compare them against your selected resume to provide a match score and personalized advice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Selection Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1 flex items-center gap-2">
            Standard Comparison Resume
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[10px] rounded-md font-bold uppercase">REQUIRED</span>
          </label>

          <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {history.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">No resumes found. Please upload one first in the CV Scoring tab.</p>
              </div>
            ) : (
              history.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => setSelectedResumeId(resume.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${selectedResumeId === resume.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 ring-1 ring-blue-100'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                >
                  <div className={`p-2.5 rounded-xl transition-colors ${selectedResumeId === resume.id ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-900/70 text-slate-950 dark:text-slate-100 group-hover:bg-slate-100'
                    }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${selectedResumeId === resume.id ? 'text-blue-900' : 'text-slate-700 dark:text-slate-200'}`}>
                      {resume.fileName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      Analyzed on {new Date(resume.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedResumeId === resume.id && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-300 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center pt-8 border-t border-slate-50 dark:border-slate-800">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze || isAnalyzing || !selectedResumeId}
          className="px-12 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white font-bold text-sm rounded-2xl transition-all tracking-wide shadow-lg shadow-blue-500/20 flex items-center gap-3"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 dark:border-white/10 border-t-white rounded-full animate-spin" />
              Analyzing Match...
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              Analyze Job Match
            </>
          )}
        </button>
      </div>
    </div>
  );
}
