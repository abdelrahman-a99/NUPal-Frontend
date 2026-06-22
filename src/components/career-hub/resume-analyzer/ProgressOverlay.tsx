import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProgressOverlayProps {
  isOpen: boolean;
  type: 'cv' | 'jobfit';
  isDataReady?: boolean;
  onComplete?: () => void;
}

const CV_STEPS = [
  "Analyzing your resume structure...",
  "Extracting professional experience...",
  "Reviewing formatting and keywords...",
  "Finalizing results and generating insights..."
];

const JOB_FIT_STEPS = [
  "Extracting job description from URL...",
  "Analyzing job requirements...",
  "Comparing candidate skills vs requirements...",
  "Evaluating experience alignment...",
  "Generating targeted recommendations...",
  "Finalizing Job Fit Score..."
];

export function ProgressOverlay({ isOpen, type, isDataReady = false, onComplete }: ProgressOverlayProps) {
  const steps = type === 'cv' ? CV_STEPS : JOB_FIT_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const stepInterval = type === 'cv' ? 800 : 2000;

    // Simulate progress
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        
        // If we're at the last step and data is ready, notify parent
        if (isDataReady && onComplete) {
          // small Delay for visual feedback of the last step completion
          setTimeout(onComplete, 800);
          clearInterval(interval);
        }
        
        return prev; // stay at last step until closed or data ready
      });
    }, stepInterval);

    return () => clearInterval(interval);
  }, [isOpen, steps.length, isDataReady, onComplete, type]);

  // Effect to handle the case where data was waiting for the last step
  useEffect(() => {
    if (isOpen && isDataReady && currentStepIndex === steps.length - 1 && onComplete) {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [isDataReady, currentStepIndex, steps.length, isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md transition-all duration-500" />

      {/* Centered Content */}
      <div className="relative w-full max-w-lg mx-auto flex flex-col items-center animate-in zoom-in-95 duration-500">

        <div className="flex items-center justify-center mb-8 relative">
          <Loader2 className="w-14 h-14 text-blue-600 dark:text-blue-300 animate-spin" />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          {type === 'cv' ? 'Select Resume for Checking' : 'Analyzing Match'}
        </h2>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 mb-12">Please wait while we process your request...</p>

        <div className="w-full max-w-md space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 transition-all duration-500 ${isCurrent ? 'opacity-100 scale-100' :
                    isCompleted ? 'opacity-60 scale-100' : 'opacity-30 scale-95'
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span className={`text-[15px] font-bold tracking-wide transition-colors duration-500 ${isCurrent ? 'text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'
                  }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Fake Progress Bar */}
        <div className="w-full max-w-xs mt-16 flex flex-col items-center gap-3">
          <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-400 uppercase">
            {Math.round(((currentStepIndex + 0.5) / steps.length) * 100)}% Complete
          </span>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, ((currentStepIndex + 0.5) / steps.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
