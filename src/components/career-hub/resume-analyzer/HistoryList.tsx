import React from 'react';
import { History as HistoryIcon, FileText, Clock, Trash2, ChevronRight } from 'lucide-react';
import { ResumeHistoryItem } from '@/services/resumeService';

interface HistoryListProps {
  history: ResumeHistoryItem[];
  onLoad: (item: ResumeHistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function HistoryList({ history, onLoad, onDelete }: HistoryListProps) {
  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
          <HistoryIcon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Analyses</h2>
      </div>
      
      <div className="grid gap-3">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onLoad(item)}
            className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all transition-none"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-none">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">{item.fileName}</h3>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 capitalize">{item.fullName || 'Analysis'}</span>
                   <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                   <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {new Date(item.analyzedAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => onDelete(e, item.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-none"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
