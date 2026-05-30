import React from 'react';

export function Section({ 
  icon, 
  title, 
  children, 
  className = "", 
  iconColor = "text-blue-600 dark:text-blue-300" 
}: { 
  icon: React.ReactNode; 
  title: string; 
  children: React.ReactNode; 
  className?: string; 
  iconColor?: string 
}) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 font-semibold text-slate-800 dark:text-slate-100">
        <div className={`p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 ${iconColor}`}>{icon}</div>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
