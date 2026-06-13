"use client";

import { motion } from "framer-motion";

export function InterviewFeedbackSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse pb-16">
      {/* ── HEADER SKELETON ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-4 flex-1">
          <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700" />
          <div className="space-y-2">
            <div className="h-10 w-3/4 max-w-md bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* Circular Score Placeholder */}
        <div className="w-28 h-28 rounded-full bg-slate-50 dark:bg-slate-900/70 border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
          <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Executive Summary Skeleton */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-5 w-11/12 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-5 w-4/5 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>

          {/* Session Breakdown Text */}
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded mx-2 mt-8" />

          {/* Question Feedback Skeletons */}
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-blue-50 dark:bg-blue-950/40 rounded" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="p-5 space-y-3 bg-slate-50/20 dark:bg-slate-900/20 md:border-l border-slate-100 dark:border-slate-800">
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Skeleton */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Competency Matrix */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Biometrics */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            {[1, 2].map(i => (
              <div key={i} className="h-12 w-full bg-slate-50 dark:bg-slate-900/70 rounded-xl" />
            ))}
          </div>

          {/* Action Plan */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-5 h-5 bg-slate-900 rounded-md" />
                <div className="h-4 flex-1 bg-slate-100 dark:bg-slate-800 rounded mt-0.5" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
