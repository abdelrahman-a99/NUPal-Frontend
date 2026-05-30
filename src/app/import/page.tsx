"use client";

import { useState } from "react";
import { API_ENDPOINTS } from "@/config/api";

export default function ImportPage() {
  const [out, setOut] = useState<string>("");
  const [emailOverride, setEmailOverride] = useState("");
  const [passwordOverride, setPasswordOverride] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Import Student</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload a student JSON file and optionally override the email or password before import.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input
            type="email"
            placeholder="Email (optional)"
            value={emailOverride}
            onChange={e => setEmailOverride(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-950/50 dark:placeholder:text-slate-500"
          />
          <input
            type="password"
            placeholder="Password (optional)"
            value={passwordOverride}
            onChange={e => setPasswordOverride(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-950/50 dark:placeholder:text-slate-500"
          />
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-blue-500 dark:hover:bg-blue-950/30">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Choose JSON file</span>
          <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">Only .json files are accepted</span>
          <input
            className="sr-only"
            type="file"
            accept=".json"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const json = JSON.parse(text);
              type Account = { id?: string | number; email: string; name?: string; password?: string };
              type Education = { total_credits?: number; num_semesters?: number; semesters?: unknown };
              type StudentPayload = { account: Account; education: Education };
              let payload: StudentPayload;
              if (json.account && json.education) {
                payload = {
                  account: {
                    id: json.account.id,
                    email: emailOverride || json.account.email,
                    name: json.account.name || 'Student',
                    password: passwordOverride || json.account.password
                  },
                  education: {
                    total_credits: json.education.total_credits,
                    num_semesters: json.education.num_semesters,
                    semesters: json.education.semesters
                  }
                };
              } else {
                payload = {
                  account: {
                    id: json.student_id,
                    email: emailOverride || json.email,
                    name: json.name || 'Student',
                    password: passwordOverride || json.password
                  },
                  education: {
                    total_credits: json.total_credits,
                    num_semesters: json.num_semesters,
                    semesters: json.semesters
                  }
                };
              }
              const res = await fetch(`${API_ENDPOINTS.STUDENTS}/import`, {

                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              setOut(JSON.stringify(data, null, 2));
            }}
          />
        </label>

        {out && (
          <pre className="mt-5 max-h-96 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 dark:border-slate-700">
            {out}
          </pre>
        )}
      </div>
    </div>
  );
}
