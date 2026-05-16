import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { ResumeHistoryItem } from '@/services/resumeService';

interface CVScoringTabProps {
  history: ResumeHistoryItem[];
  isHistoryLoading: boolean;
  onUpload: (file: File) => void;
  onSelectExisting: (item: ResumeHistoryItem) => void;
  isUploading: boolean;
  onDeleteHistory?: (e: React.MouseEvent, id: string) => void;
}

export function CVScoringTab({ history, isHistoryLoading, onUpload, onSelectExisting, isUploading, onDeleteHistory }: CVScoringTabProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-10">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 animate-in fade-in duration-500 w-full max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Select Resume for Checking</h2>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-100 mt-2 tracking-wide">Upload a new document or choose from your history</p>
        </div>

        <div className="w-full max-w-2xl mx-auto space-y-4">
          <div
            className={`relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer min-h-[300px] ${
              dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              accept=".pdf,.doc,.docx"
              disabled={isUploading}
            />
            <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-300 mb-6">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-[17px] font-bold text-slate-800 dark:text-slate-100">Upload Resume</p>
            <p className="text-[13px] font-semibold text-slate-950 dark:text-slate-100 mt-2 text-center">Drag and drop your resume here, or click <br/>to browse from your device</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-6">Supports PDF files up to 5MB</p>
          </div>
        </div>
      </div>

      {(isHistoryLoading || history.length > 0) && (
        <div className="w-full max-w-5xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 ml-1">Existing Resumes</h3>
          <div className="w-full flex flex-col gap-4">
            {isHistoryLoading ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    <div className="flex flex-col gap-2.5">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                      <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[85px] h-[42px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/70 rounded-xl animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    <div className="flex flex-col gap-2.5">
                      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                      <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[85px] h-[42px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/70 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors group gap-4"
                >
                  {/* Left section: Icon and Info */}
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm font-bold text-sm uppercase overflow-hidden">
                      <FileText className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
                    </div>

                    <div className="flex flex-col mb-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-[16px] text-slate-950 dark:text-slate-100 tracking-tight">
                          {item.fileName}
                        </h3>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-950 dark:text-slate-100 mt-1">
                        {new Date(item.analyzedAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right section: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectExisting(item)}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-950 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold text-[13px] transition-colors"
                    >
                      View <ArrowRight className="w-4 h-4 ml-0.5" />
                    </button>
                    {onDeleteHistory && (
                      <>
                        <div className="w-1 h-3 border-r border-slate-200 dark:border-slate-700 mx-1"></div>
                        <button
                          onClick={(e) => onDeleteHistory(e, item.id)}
                          className="p-2.5 text-slate-950 dark:text-slate-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors shrink-0"
                          title="Delete History"
                        >
                          <Trash2 className="w-5 h-5 pointer-events-none" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
