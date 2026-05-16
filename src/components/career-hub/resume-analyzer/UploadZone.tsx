import React, { useRef, useState, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface UploadZoneProps {
  onFile: (file: File) => void;
  loading: boolean;
}

export function UploadZone({ onFile, loading }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-5
        w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed
        cursor-pointer select-none py-16 px-8 text-center
        ${isDragging
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300'}
        ${loading ? 'pointer-events-none opacity-80' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      <div className={`relative p-5 rounded-2xl ${isDragging ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {loading ? (
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        ) : (
          <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-slate-400 dark:text-slate-400'}`} />
        )}
      </div>

      {loading ? (
        <>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-300">Analyzing your resume...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Extracting details. Please wait.</p>
        </>
      ) : (
        <>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Drop your CV / Resume here
            </p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              or{' '}
              <span className="text-blue-600 dark:text-blue-300 font-medium underline underline-offset-2">click to browse</span>
              {' '}— PDF only
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Professional Parser</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Verbatim Extraction</span>
          </div>
        </>
      )}
    </div>
  );
}
