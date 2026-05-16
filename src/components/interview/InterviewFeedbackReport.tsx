import { 
  BarChart3,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export type InterviewFeedback = {
  overall?: string;
  bodyLanguageComment?: string;
  postureObjectiveNotes?: string[];
  questionFeedback?: {
    question?: string;
    strengths?: string;
    improvements?: string;
  }[];
  recommendations?: string[];
  scores?: {
    technical?: number;
    communication?: number;
    presence?: number;
  };
};

export default function InterviewFeedbackReport({
  feedback,
  onNewSession,
  cameraEnabled = false,
}: {
  feedback: InterviewFeedback;
  onNewSession: () => void;
  cameraEnabled?: boolean;
}) {
  const handlePrint = () => {
    const content = document.getElementById("printable-report");
    if (!content) return;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Compile CSS links and rules
    const styleTags = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          if (sheet.href) return `<link rel="stylesheet" href="${sheet.href}">`;
          return `<style>${Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("")}</style>`;
        } catch (e) {
          // Cross-origin stylesheet access blocked
          return "";
        }
      })
      .join("\n");

    iframeDoc.write(`
      <html>
        <head>
          <title>Interview Evaluation</title>
          ${styleTags}
          <style>
            @page { margin: 20mm; }
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              background: white;
            }
            .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body class="bg-white dark:bg-slate-900 p-8">
          ${content.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  };

  return (
    <div id="printable-report" className="w-full max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16 px-4 md:px-6">
      {/* ── HEADER & SCORE ───────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700">
              Analyst Report
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Interview Evaluation
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">
              Technical assessment and behavioral debrief.
            </p>
          </div>
        </div>

        {/* Global Match Score Bubble */}
        {feedback.scores && (
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56" cy="56" r="48"
                className="stroke-slate-100 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="56" cy="56" r="48"
                className="stroke-blue-600 fill-none"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - (
                  ( (feedback.scores.technical ?? 0) + (feedback.scores.communication ?? 0) + (feedback.scores.presence ?? 0) ) / 3
                ) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                {Math.round(((feedback.scores.technical ?? 0) + (feedback.scores.communication ?? 0) + (feedback.scores.presence ?? 0)) / 3)}%
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-blue-400">Readiness</span>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Executive Summary */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-[0.25em]">Executive Summary</h2>
            </div>
            <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-lg font-semibold">
              {feedback.overall}
            </p>
            
            {cameraEnabled && feedback.bodyLanguageComment && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Mentor Insight</span>
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic text-sm">
                  {feedback.bodyLanguageComment}
                </p>
              </div>
            )}
          </section>

          {/* Detailed Question Review */}
          {feedback.questionFeedback && feedback.questionFeedback.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.25em] px-2 mb-6">Session Breakdown</h2>
              <div className="space-y-4">
                {feedback.questionFeedback.map((qf, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex gap-3">
                        <span className="text-blue-600 dark:text-blue-300">{i + 1}.</span>
                        {qf.question}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="p-5 space-y-2">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-widest">Technical Strengths</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{qf.strengths}</p>
                      </div>
                      <div className="p-5 space-y-2 bg-slate-50/20 dark:bg-slate-900/20 md:border-l border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Growth Areas</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{qf.improvements}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Matrices */}
          {feedback.scores && (
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
              <h2 className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em] mb-4">Competency Match</h2>
              <div className="space-y-6">
                {(
                  [
                    ["technical", "Technical Depth", "blue-600"],
                    ["communication", "Communication", "blue-500"],
                    ["presence", "Professional Presence", "blue-400"],
                  ] as const
                ).map(([key, label, color]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">{label}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">{feedback.scores?.[key] ?? 0}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, feedback.scores?.[key] ?? 0)}%` }}
                        className={`h-full bg-${color} rounded-full transition-all duration-1000`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Biometric Analysis — only when camera was active */}
          {cameraEnabled && feedback.postureObjectiveNotes && feedback.postureObjectiveNotes.length > 0 && (
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em] mb-4">Biometric Logs</h2>
              <div className="space-y-2">
                {feedback.postureObjectiveNotes.map((note, i) => (
                  <div key={i} className="p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-200 font-bold flex items-start gap-3">
                    <ChevronRight className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                    {note}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {feedback.recommendations && feedback.recommendations.length > 0 && (
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em] mb-6">Action Plan</h2>
              <div className="space-y-4">
                {feedback.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </div>
                    <p className="text-[11px] text-slate-800 dark:text-slate-100 font-bold leading-relaxed">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="pt-4 space-y-3 print:hidden">
            <button 
              onClick={onNewSession}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Start New Analysis
            </button>
            <button 
              onClick={handlePrint}
              className="w-full py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Export Analysis PDF
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
