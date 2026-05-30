"use client";

import Link from "next/link";
import { MoveLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-white dark:bg-slate-900 px-6">
      <div className="relative">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-50 dark:bg-blue-950/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-50 dark:bg-indigo-950/40 blur-3xl" />
        <div className="relative text-center">
          <h1 className="bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-[12rem] font-black leading-none text-transparent">
            404
          </h1>

          <div className="mt-4 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Page not found</h2>
            <p className="mx-auto max-w-md text-slate-600 dark:text-slate-300">
              Oops! It seems you've wandered into uncharted territory.
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl bg-blue-400 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-blue-200"
            >
              <MoveLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
