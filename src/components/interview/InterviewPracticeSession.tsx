"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "@/lib/auth";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mic2,
  Video,
  VideoOff,
  Loader2,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Phone,
  Keyboard,
  Target,
  AlertCircle,
  Activity,
  CheckCircle2,
  User,
} from "lucide-react";

import Button from "@/components/ui/Button";
import InterviewFeedbackReport, {
  type InterviewFeedback,
} from "@/components/interview/InterviewFeedbackReport";
import { InterviewFeedbackSkeleton } from "@/components/interview/InterviewFeedbackSkeleton";
import {
  aggregateSamples,
  type FrameScores,
} from "@/lib/interview/bodyLanguage";
import { JobSelector } from "@/components/career-hub/resume-analyzer/JobSelector";
import { type JobFitHistoryItem } from "@/services/resumeService";
import { careerServicesApiUrl } from "@/config/careerApi";

const PoseTracker = dynamic(
  () => import("@/components/interview/PoseTracker"),
  { ssr: false, loading: () => null }
);

/** Safe parsing to catch empty/missing JSON bodies from proxies */
async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export const VOICE_STORAGE_KEY = "nupalVoiceInterview";

export type JobInterviewContext = {
  jobTitle: string;
  companyName?: string | null;
  /** Full JD text (pasted or scraped from the job URL in Job Match) */
  jobDescription: string;
  jobUrl?: string | null;
};

type Difficulty = "entry" | "mid" | "senior";
type PracticeMode = "text" | "voice";

type QuestionItem = {
  question: string;
  category?: string;
  context?: string;
};

type FeedbackShape = {
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

type InterviewPracticeSessionProps = {
  /** When set, questions and voice agent are tailored to this job (from Job Match). */
  jobContext?: JobInterviewContext | null;
  /** Compact layout inside Career Hub */
  compact?: boolean;
  /** History for job selection when in Career Hub */
  jobFitHistory?: JobFitHistoryItem[];
  /** Callback for selecting a job from history */
  onJobSelect?: (item: JobFitHistoryItem) => void;
  /** Loading state for history or details */
  isLoadingHistory?: boolean;
};

export function InterviewPracticeSession({
  jobContext,
  compact,
  jobFitHistory,
  onJobSelect,
  isLoadingHistory,
}: InterviewPracticeSessionProps) {
  const router = useRouter();
  const defaultTopic = useMemo(() => {
    if (!jobContext) return "Target role";
    const t = (jobContext.jobTitle || "").trim();
    const c = (jobContext.companyName || "").trim();
    if (t && c) return `${t} (${c})`;
    if (t) return t;
    return "Target role";
  }, [jobContext?.jobTitle, jobContext?.companyName]);

  const [practiceMode, setPracticeMode] = useState<PracticeMode>("text");
  const [step, setStep] = useState<
    "setup" | "loading" | "questions" | "loadingFeedback" | "report"
  >("setup");
  const [topic] = useState(defaultTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>("entry");
  const [questionCount, setQuestionCount] = useState(5);
  const [voiceDurationMin, setVoiceDurationMin] = useState(15);
  const [voiceWithCamera, setVoiceWithCamera] = useState(true);
  const [cvText, setCvText] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [poseSamples, setPoseSamples] = useState<FrameScores[]>([]);
  const [feedback, setFeedback] = useState<FeedbackShape | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "setup") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [step]);

  const difficultyLabel = useMemo(
    () =>
      ({
        entry: "Beginner / entry-level",
        mid: "Intermediate",
        senior: "Senior / advanced",
      })[difficulty],
    [difficulty]
  );

  const apiJobPayload = useMemo(
    () => ({
      jobTitle: jobContext?.jobTitle || "",
      companyName: jobContext?.companyName ?? undefined,
      jobDescription: jobContext?.jobDescription || "",
    }),
    [jobContext]
  );

  const startSession = async () => {
    setError(null);
    setStep("loading");
    setPoseSamples([]);
    setFeedback(null);
    try {
      const token = getToken();
      const res = await fetch(careerServicesApiUrl("/v1/interview/generate-questions"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          questionCount,
          ...apiJobPayload,
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) {
        throw new Error(data?.error || data?.message || "Request failed");
      }
      const qs = (data.questions || []) as QuestionItem[];
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
      setCurrentQuestionIndex(0);
      setStep("questions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
      setStep("setup");
    }
  };

  const submitAnswers = async () => {
    setError(null);
    setStep("loadingFeedback");
    const agg = aggregateSamples(poseSamples);
    try {
      const token = getToken();
      const res = await fetch(careerServicesApiUrl("/v1/interview/generate-feedback"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty: difficultyLabel,
          questions: questions.map((q) => q.question),
          answers: questions.map((q, i) => ({
            question: q.question,
            answer: answers[i] ?? "",
          })),
          bodyLanguageSummary: useCamera ? agg.summaryForModel : undefined,
          bodyLanguageMetrics:
            useCamera && poseSamples.length > 0 ? agg : undefined,
          ...apiJobPayload,
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) {
        throw new Error(data?.error || data?.message || "Request failed");
      }
      setFeedback((data.feedback || null) as FeedbackShape);
      setStep("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get feedback");
      setStep("questions");
    }
  };

  const resetAll = () => {
    setStep("setup");
    setQuestions([]);
    setAnswers([]);
    setPoseSamples([]);
    setFeedback(null);
    setError(null);
  };

  const goToVoiceInterview = () => {
    sessionStorage.setItem(
      VOICE_STORAGE_KEY,
      JSON.stringify({
        topic: topic.trim(),
        difficulty,
        interviewDuration: voiceDurationMin,
        cvText: cvText.trim() || undefined,
        useCamera: voiceWithCamera,
        jobDescription: jobContext?.jobDescription || "",
        jobTitle: jobContext?.jobTitle || "",
        companyName: jobContext?.companyName ?? undefined,
      })
    );
    router.push("/interview/voice");
  };

  const onPoseSamples = useCallback((samples: FrameScores[]) => {
    setPoseSamples(samples);
  }, []);

  const poseAgg = useMemo(
    () => aggregateSamples(poseSamples),
    [poseSamples]
  );

  const wrapClass = compact
    ? "w-full mx-auto px-0 py-4"
    : "w-full mx-auto px-4 py-8 sm:px-6 lg:px-8";

  return (
    <div className={wrapClass}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50/50 backdrop-blur-sm px-6 py-4 text-sm text-red-800 dark:text-red-200 shadow-sm"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">{error}</span>
          </div>
        </motion.div>
      )}

      {step === "setup" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-blue-900/5 overflow-hidden"
        >
          {/* Light Theme Header per Mockup */}
          <div className="relative p-3 md:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100/50 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1">
                  Technical Interview Prep
                </h1>
                <p className="text-slate-900 dark:text-slate-100 font-semibold text-xs sm:text-sm">
                  AI-powered practice session
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6 bg-white dark:bg-slate-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1 leading-none">Target Role</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pick a previously analyzed job to generate tailored questions.</p>
              </div>

              <div className="max-w-md w-full">
                {jobFitHistory && onJobSelect && (
                  <div className="group transition-all duration-300">
                    <JobSelector
                      history={jobFitHistory}
                      selectedId={(jobContext as any)?.id}
                      onSelect={onJobSelect}
                      isLoading={isLoadingHistory}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Section 2: Session Mode */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1 leading-none">Session Mode</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred interaction method.</p>
              </div>

              <div className="flex p-1 bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-2xl gap-2 shadow-sm">
                <button
                  key="text"
                  type="button"
                  onClick={() => setPracticeMode("text")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-xs
                    ${practiceMode === 'text'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50 ring-2 ring-blue-500/5"
                      : "text-slate-900 dark:text-slate-100 hover:text-slate-900"}`}
                >
                  <Keyboard className="w-4 h-4" />
                  Text Interview
                </button>
                <button
                  key="voice"
                  type="button"
                  onClick={() => setPracticeMode("voice")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-xs group
                    ${practiceMode === 'voice'
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50 ring-2 ring-blue-500/5"
                      : "text-slate-900 dark:text-slate-100 hover:text-slate-900"}`}
                >
                  <Phone className="w-4 h-4" />
                  Voice Call
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 rounded-md ml-1 group-hover:bg-slate-200 transition-colors">Beta</span>
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Section: Simulation Settings */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1 leading-none">Simulation Settings</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Adjust the intensity and length of the interview.</p>
              </div>

              <div className="space-y-10 py-4">
                {/* Difficulty Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Difficulty Level</h4>
                  <div className="flex bg-slate-50/50 dark:bg-slate-900/50 p-1 rounded-2xl gap-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                    {(['entry', 'mid', 'senior'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all
                          ${difficulty === lvl
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50 ring-2 ring-blue-500/5"
                            : "text-slate-900 dark:text-slate-100 hover:text-slate-900"}`}
                      >
                        {lvl === 'entry' ? 'Beginner' : lvl === 'mid' ? 'Intermediate' : 'Expert'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Length</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {practiceMode === 'voice' ? 'Short' : 'Short'}
                    </span>
                    <div className="flex items-center bg-slate-50/50 dark:bg-slate-900/50 p-1 rounded-2xl gap-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                      {(practiceMode === 'voice' ? [5, 10, 15, 20, 25, 30] : [3, 4, 5, 6, 7, 8]).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => practiceMode === 'voice' ? setVoiceDurationMin(num) : setQuestionCount(num)}
                          className={`w-10 h-10 rounded-full text-xs font-bold transition-all
                            ${(practiceMode === 'voice' ? voiceDurationMin === num : questionCount === num)
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                              : "text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"}`}
                        >
                          {num}{practiceMode === 'voice' ? 'm' : ''}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {practiceMode === 'voice' ? 'Long' : 'Long'}
                    </span>
                  </div>
                </div>

                {/* Posture Analysis Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1">Posture Analysis</h4>
                  <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-2 px-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700">
                      <Video className="w-5 h-5 text-blue-500" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80 leading-none">Evaluating</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => practiceMode === 'text' ? setUseCamera(!useCamera) : setVoiceWithCamera(!voiceWithCamera)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${(practiceMode === 'text' ? useCamera : voiceWithCamera) ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      <motion.div
                        animate={{ x: (practiceMode === 'text' ? useCamera : voiceWithCamera) ? 22 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Contextual Notes */}
            <AnimatePresence>
              {practiceMode === "voice" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 ml-1 pb-2">Candidate Briefing (Optional)</h3>
                  </div>
                  <textarea
                    className="min-h-[80px] w-full rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-4 text-sm text-slate-900 dark:text-slate-100 outline-none ring-blue-500/10 focus:border-blue-500 focus:ring-[12px] transition-all placeholder:text-slate-300"
                    placeholder="Briefly describe your focus areas or specific projects you want the AI recruiter to touch upon during the call…"
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                disabled={!jobContext}
                onClick={() => practiceMode === "text" ? void startSession() : goToVoiceInterview()}
                className={`flex items-center gap-2 px-10 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all
                  ${!jobContext
                    ? "bg-slate-50 dark:bg-slate-900/70 text-slate-300 border border-slate-100 dark:border-slate-800 cursor-not-allowed"
                    : "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98]"
                  }
                `}
              >
                {!jobContext ? (
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 opacity-30" />
                    SELECT A JOB FIRST
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {practiceMode === 'text' ? 'START TECHNICAL SIMULATION' : 'INITIATE AI CALL SESSION'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {step === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 overflow-hidden"
        >
          {/* ── SIMPLE CALM HEADER SKELETON ───────────────────────────────── */}
          <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-6">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 w-8 h-8 animate-pulse border border-slate-100 dark:border-slate-800" />
                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-50 dark:bg-slate-900/70 rounded animate-pulse" />
                </div>
             </div>
             <div className="flex items-center gap-8">
                <div className="hidden lg:flex flex-col items-end gap-1.5">
                   <div className="h-2 w-48 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
             </div>
          </header>

          <main className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* ASSESSMENT LAYOUT SKELETON */}
              <div className="lg:col-span-8 flex flex-col gap-10">
                <div className="space-y-3 mb-4 px-2">
                  <div className="h-8 w-60 bg-slate-200/60 rounded-lg animate-pulse" />
                  <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                </div>

                {[1, 2].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 md:p-10 space-y-8 shadow-sm animate-pulse">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="h-3 w-20 bg-slate-50 dark:bg-slate-900/70 rounded" />
                      </div>
                      <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-md" />
                      <div className="h-6 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-md" />
                    </div>
                    <div className="h-40 w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800" />
                  </div>
                ))}
              </div>

              {/* SIDEBAR ASSESSMENT SKELETON */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-8 space-y-6 shadow-sm animate-pulse">
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                  <div className="aspect-video w-full bg-slate-100/50 rounded-2xl border border-slate-100 dark:border-slate-800" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-14 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl" />
                    <div className="h-14 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-8 space-y-6 shadow-sm animate-pulse">
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4">
                        <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-3 flex-1 bg-slate-50 dark:bg-slate-900/70 rounded mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </main>
        </motion.div>
      )}

      {step === "questions" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900/70 overflow-y-auto custom-scrollbar"
        >
          {/* ── CLEAN PROFESSIONAL HEADER ───────────────────────────────── */}
          <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-6">
                <button
                  onClick={resetAll}
                  className="group flex items-center gap-2 text-slate-400 dark:text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 group-hover:bg-slate-100 border border-slate-100 dark:border-slate-800 transition-all">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Exit Session</span>
                </button>
                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none mb-1">Technical Assessment</h2>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight">{jobContext?.jobTitle || "Standard Protocol"}</p>
                </div>
             </div>

             <div className="flex items-center gap-8">
                <div className="hidden lg:flex flex-col items-end gap-1.5">
                   <div className="flex justify-between w-48 text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                      <span>Completion</span>
                      <span>{Math.round((answers.filter(a => a.trim()).length / questions.length) * 100)}%</span>
                   </div>
                   <div className="h-1.5 w-48 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                      <motion.div 
                        animate={{ width: `${(answers.filter(a => a.trim()).length / questions.length) * 100}%` }}
                        className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.2)]"
                      />
                   </div>
                </div>
             </div>
          </header>

          <main className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* PRIMARY QUESTION LIST (Left or Centered) */}
              <div className={`flex flex-col gap-12 ${useCamera ? 'lg:col-span-8' : 'lg:col-span-8 lg:col-start-3'}`}>
                <div className="space-y-2 mb-4">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Required Scenarios</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Answer the following questions to complete your technical evaluation.</p>
                </div>

                {questions.map((q, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                  >
                    <div className="p-8 md:p-10 space-y-8">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-xs font-black">
                              {idx + 1}
                            </span>
                            {q.category && (
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/70 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                                {q.category}
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                            {q.question}
                          </h4>
                        </div>
                      </div>

                      <div className="relative group">
                        <textarea
                          className="min-h-[200px] w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-8 py-6 text-base text-slate-800 dark:text-slate-100 outline-none ring-blue-500/5 focus:border-blue-500 focus:bg-white focus:ring-[12px] transition-all placeholder:text-slate-300 custom-scrollbar"
                          placeholder="Provide your detailed technical response..."
                          value={answers[idx] ?? ""}
                          onChange={(e) => {
                            const next = [...answers];
                            next[idx] = e.target.value;
                            setAnswers(next);
                          }}
                        />
                        <div className="absolute top-4 right-6 text-[9px] font-black text-slate-200 uppercase tracking-widest pointer-events-none group-focus-within:text-blue-200 transition-colors">
                           Response Field
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div className="pt-8 pb-16 flex flex-col items-center gap-3">
                  {answers.some(a => !a.trim()) && (
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                      Answer all questions to submit
                    </p>
                  )}
                  <button
                    onClick={() => void submitAnswers()}
                    disabled={answers.some(a => !a.trim())}
                    className={`px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center gap-4
                      ${answers.some(a => !a.trim())
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/20'
                      }`
                    }
                  >
                    Finalize & Submit Evaluation
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* SIDEBAR: STICKY CAMERA & GUIDELINES (Right) — only shown when camera is on */}
              {useCamera && (
                <div className="lg:col-span-4 sticky top-28 space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide pb-8">
                  
                  {/* AI Bio-Sync Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-100/50">
                             <Target className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">AI Bio-Sync</h3>
                       </div>
                       <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-100/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[9px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest">Monitoring</span>
                       </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 shadow-inner group relative mb-4">
                       <PoseTracker active={useCamera} onSamplesChange={onPoseSamples} />
                       <div className="absolute inset-0 border-2 border-white/20 dark:border-white/10 rounded-2xl pointer-events-none group-hover:border-blue-500/20 transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">Symmetry</p>
                          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{poseAgg.frameCount ? poseAgg.avgSymmetry.toFixed(0) : "—"}%</p>
                       </div>
                       <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">Attention</p>
                          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{poseAgg.frameCount ? poseAgg.avgFacing.toFixed(0) : "—"}%</p>
                       </div>
                    </div>
                  </div>

                  {/* Session Rules */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                     <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">Protocols</h3>
                     <ul className="space-y-4">
                        {[
                          'Maintain consistent eye contact.',
                          'Avoid excessive fidgeting.',
                          'Answer with technical depth.'
                        ].map((tip, i) => (
                          <li key={i} className="flex items-start gap-4">
                             <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shadow-lg shadow-slate-900/20">
                                {i + 1}
                             </div>
                             <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight pt-0.5">{tip}</p>
                          </li>
                        ))}
                     </ul>
                  </div>
                </div>
              )}

            </div>
          </main>
        </motion.div>
      )}

      {step === "loadingFeedback" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[110] bg-white dark:bg-slate-900 overflow-y-auto px-4 py-12 md:px-8"
        >
          <div className="max-w-6xl mx-auto">
            <InterviewFeedbackSkeleton />
          </div>
        </motion.div>
      )}

      {step === "report" && feedback && (
        <div className="fixed inset-0 z-[120] bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12 bg-white dark:bg-slate-900 min-h-screen">
            <div className="mb-8">
              <button
                onClick={resetAll}
                className="group flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-all duration-300"
              >
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 group-hover:bg-slate-100 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-all">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold tracking-tight">Back to Dashboard</span>
              </button>
            </div>

            <InterviewFeedbackReport 
              feedback={feedback as InterviewFeedback} 
              onNewSession={resetAll}
              cameraEnabled={useCamera}
            />
          </div>
        </div>
      )}
    </div>
  );
}
