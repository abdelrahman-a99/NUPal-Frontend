"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mock interview now lives under Career Hub → Technical Interview Preparation
 * (after Job Match), with questions grounded in that job description.
 */
export default function InterviewRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/career-hub?tab=interview-prep");
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-4 text-center text-slate-600 dark:text-slate-300">
      <p className="text-sm">Redirecting to Career Hub…</p>
    </div>
  );
}
