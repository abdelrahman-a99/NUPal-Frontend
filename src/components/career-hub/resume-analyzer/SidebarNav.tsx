import React from 'react';
import { BarChart2, Target, Bot } from 'lucide-react';

export type NavTabId = 'resume-checking' | 'job-fit' | 'interview-prep';

interface NavItem {
  id: NavTabId;
  title: string;
  description: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'resume-checking',
    title: 'Resume Checking',
    description: 'Get deep AI-powered insights on your CV structure',
    icon: BarChart2,
  },
  {
    id: 'job-fit',
    title: 'Job Match Analysis',
    description: 'Measure your fit against any job description',
    icon: Target,
  },
  {
    id: 'interview-prep',
    title: 'Technical Interview Preparation',
    description: 'Practice interviews for the job you matched',
    icon: Bot,
  }
];

interface SidebarNavProps {
  activeTab: NavTabId;
  onSelect: (tab: NavTabId) => void;
  /** Step 3 requires a completed Job Match for a role */
  interviewLocked: boolean;
}

export function SidebarNav({ activeTab, onSelect, interviewLocked }: SidebarNavProps) {
  return (
    <nav className="w-full max-w-sm space-y-4 pr-6 shrink-0 relative">
      <div className="absolute left-10 top-10 bottom-10 w-px bg-slate-200 dark:bg-slate-700 -z-10" />

      {NAV_ITEMS.map((item, index) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-start text-left gap-4 p-4 rounded-2xl transition-all relative hover:bg-slate-50/80 dark:hover:bg-slate-800/80 border border-transparent`}
          >
            <div className={`mt-0.5 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0 border-4 transition-all ${isActive
              ? 'bg-blue-600 border-blue-50 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-100 shadow-sm'
              }`}>
              <Icon className="w-4 h-4 lg:w-5 h-5" />
            </div>
            <div className="flex-1 mt-1.5">
              <h3 className={`font-bold text-sm tracking-tight ${isActive ? 'text-blue-900' : 'text-slate-800 dark:text-slate-100'}`}>
                {item.title}
              </h3>
              <p className={`mt-0.5 text-xs font-semibold leading-relaxed ${isActive ? 'text-blue-600/80' : 'text-slate-400 dark:text-slate-400'}`}>
                {item.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
