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
    <nav className="w-full lg:max-w-sm flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-3 lg:space-y-4 pr-0 lg:pr-6 shrink-0 relative pb-3 lg:pb-0 scrollbar-none">
      <div className="hidden lg:block absolute left-10 top-10 bottom-10 w-px bg-slate-200 -z-10" />

      {NAV_ITEMS.map((item, index) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex-shrink-0 w-[240px] sm:w-[280px] lg:w-full flex items-start text-left gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl transition-all relative hover:bg-slate-50/80 border ${isActive ? 'bg-blue-50/30 border-blue-100 lg:border-transparent' : 'bg-white border-slate-100 lg:border-transparent'}`}
          >
            <div className={`mt-0.5 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0 border-4 transition-all ${isActive
              ? 'bg-blue-600 border-blue-50 text-white'
              : 'bg-white border-slate-50 text-slate-500 hover:border-slate-100 shadow-sm'
              }`}>
              <Icon className="w-4 h-4 lg:w-5 h-5" />
            </div>
            <div className="flex-1 mt-1 lg:mt-1.5 min-w-0">
              <h3 className={`font-bold text-xs lg:text-sm tracking-tight truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                {item.title}
              </h3>
              <p className={`mt-0.5 text-[10px] lg:text-xs font-semibold leading-relaxed truncate lg:whitespace-normal lg:line-clamp-2 ${isActive ? 'text-blue-600/80' : 'text-slate-400'}`}>
                {item.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
