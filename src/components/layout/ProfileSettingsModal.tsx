'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, User, Settings, Bell, Eye, Shield, Sun, Globe, LogOut, ChevronDown, ChevronUp, Star, BookOpen, BarChart2, TrendingUp, GraduationCap, Layers, Award, Target, Calendar, Clock, Briefcase, CheckCircle, XCircle, AlertCircle, Save, Check, Download, Link } from 'lucide-react';
import { getToken, parseJwt, removeToken } from '@/lib/auth';
import { getStudentByEmail, StudentResponse } from '@/services/studentService';
import { getMyRegistration } from '@/services/schedulingApi';
import { exportAcademicData } from '@/lib/exportData';
import { getStoredSettings, saveSettings, syncStoredTheme, watchSystemTheme } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ModalTab = 'profile' | 'settings';

interface Props {
  open: boolean;
  defaultTab?: ModalTab;
  onClose: () => void;
}

interface SettingsState {
  emailNotifications: boolean;
  scheduleApprovalAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
  autoSaveDrafts: boolean;
  language: 'en' | 'ar';
  sessionRemember: boolean;
}

const defaultSettings = (): SettingsState => ({
  emailNotifications: true, scheduleApprovalAlerts: true,
  theme: 'system', autoSaveDrafts: true,
  language: 'en',
  sessionRemember: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGPABadge(gpa: number) {
  if (gpa >= 3.7) return { label: 'Excellent', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' };
  if (gpa >= 3.0) return { label: 'Good Standing', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' };
  if (gpa >= 2.0) return { label: 'Satisfactory', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' };
  return { label: 'At Risk', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60' };
}
function getAcademicLevel(credits: number) {
  if (credits <= 35) return { level: 'Freshman', short: 'FR' };
  if (credits <= 70) return { level: 'Sophomore', short: 'SO' };
  if (credits <= 105) return { level: 'Junior', short: 'JR' };
  return { level: 'Senior', short: 'SR' };
}
function getRegBadge(reg: any) {
  const s = reg?.status?.toLowerCase();
  if (s === 'approved') return { label: 'Approved', Icon: CheckCircle, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' };
  if (s === 'rejected') return { label: 'Rejected', Icon: XCircle, color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60' };
  if (reg) return { label: 'Pending', Icon: AlertCircle, color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' };
  return null;
}
function getGPAColor(gpa: number) {
  if (gpa >= 3.7) return 'text-emerald-600 dark:text-emerald-300';
  if (gpa >= 3.0) return 'text-blue-600 dark:text-blue-300';
  if (gpa >= 2.0) return 'text-amber-600 dark:text-amber-300';
  return 'text-red-500';
}

// ── Small reusable pieces ────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-slate-900 shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="mr-4">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {desc && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function StatMini({ label, value, color = 'text-slate-900 dark:text-slate-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function SemRow({ sem, idx }: { sem: any; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-2">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{sem.term}</p>
          <p className="text-xs text-slate-400 dark:text-slate-400">{sem.courses.length} courses · {sem.semesterCredits} cr</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-sm font-black ${getGPAColor(sem.semesterGpa)}`}>{sem.semesterGpa.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">SEM</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{sem.cumulativeGpa.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">CUM</p>
          </div>
          {open ? <ChevronUp size={14} className="text-slate-400 dark:text-slate-400" /> : <ChevronDown size={14} className="text-slate-400 dark:text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 bg-slate-50/50 dark:bg-slate-900/50">
          <table className="w-full text-xs mt-2">
            <thead><tr>
              <th className="text-left pb-1.5 text-slate-400 dark:text-slate-400 font-semibold">Course</th>
              <th className="text-center pb-1.5 text-slate-400 dark:text-slate-400 font-semibold">Cr</th>
              <th className="text-center pb-1.5 text-slate-400 dark:text-slate-400 font-semibold">Grade</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sem.courses.map((c: any, i: number) => (
                <tr key={i}>
                  <td className="py-1.5 font-medium text-slate-700 dark:text-slate-200 pr-2">{c.courseName}</td>
                  <td className="py-1.5 text-center text-slate-500 dark:text-slate-400">{c.credit}</td>
                  <td className="py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full font-bold ${['A', 'A+'].includes(c.grade) ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                      ['B', 'B+'].includes(c.grade) ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                        ['C', 'C+'].includes(c.grade) ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                          'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'}`}>{c.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ student, registration, userName, userEmail, showRegistrationAlerts }: { student: StudentResponse; registration: any; userName: string; userEmail: string; showRegistrationAlerts: boolean }) {
  const { education, account } = student;
  const lastSem = education.semesters[education.semesters.length - 1];
  const cumGPA = lastSem?.cumulativeGpa ?? 0;
  const latestGPA = lastSem?.semesterGpa ?? 0;
  const level = getAcademicLevel(education.totalCredits);
  const gpaBadge = getGPABadge(cumGPA);
  const regBadge = getRegBadge(registration);
  const initial = (account.name?.charAt(0) ?? '').toUpperCase();
  const totalCourses = education.semesters.reduce((a, s) => a + s.courses.length, 0);
  const creditsRemaining = Math.max(0, 135 - education.totalCredits);
  const progressPct = Math.min(100, Math.round((education.totalCredits / 135) * 100));

  // Helper to match backend's 3-credit-per-course logic
  const calculateCredits = (reg: any) => {
    if (reg?.totalCredits) return reg.totalCredits;
    if (reg?.selectedBlock?.totalCredits) return reg.selectedBlock.totalCredits;
    const courses = reg?.selectedBlock?.courses || [];
    if (courses.length === 0) return 0;
    const uniqueNames = new Set(courses.map((c: any) =>
      (c.courseName || c.course_name || '').split('-')[0].split('(')[0].trim()
    ).filter(Boolean));
    return uniqueNames.size * 3;
  };

  return (
    <div className="space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{initial}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{account.name}</h2>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatMini label="Cum. GPA" value={cumGPA.toFixed(2)} color={getGPAColor(cumGPA)} />
        <StatMini label="Latest GPA" value={latestGPA.toFixed(2)} color={getGPAColor(latestGPA)} />
        <StatMini label="Credits" value={String(education.totalCredits)} />
        <StatMini label="Courses" value={String(totalCourses)} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Graduation Progress</p>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-400">{progressPct}% · {creditsRemaining} cr remaining</p>
        </div>
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-slate-800 rounded-full"
            style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-slate-300 font-semibold">
          <span>FR</span><span>SO</span><span>JR</span><span>SR</span><span>135</span>
        </div>
      </div>

      {/* Registration */}
      {registration && regBadge && showRegistrationAlerts && (
        <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Briefcase size={14} className="text-slate-400 dark:text-slate-400" /> Schedule Registration
            </p>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${regBadge.color}`}>
              <regBadge.Icon size={11} />{regBadge.label}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-slate-400 dark:text-slate-400 mb-0.5 font-semibold uppercase tracking-wider text-[10px]">Block</p><p className="font-bold text-slate-800 dark:text-slate-100">{registration.selectedBlock?.blockId || registration.selectedBlock?.block_id || '—'}</p></div>
            <div><p className="text-slate-400 dark:text-slate-400 mb-0.5 font-semibold uppercase tracking-wider text-[10px]">Semester</p><p className="font-bold text-slate-800 dark:text-slate-100">{registration.selectedBlock?.semester || '—'}</p></div>
            <div>
              <p className="text-slate-400 dark:text-slate-400 mb-0.5 font-semibold uppercase tracking-wider text-[10px]">Credits</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {calculateCredits(registration) || '—'}
              </p>
            </div>
          </div>
          {registration.adminNote && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2">Note: {registration.adminNote}</p>
          )}
        </div>
      )}

      {/* Academic Information Summary */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-4 flex items-center gap-1.5">
          <BookOpen size={12} /> Academic Information
        </p>
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
          <InfoItem label="Academic Year" value={level.level} />
          <InfoItem label="Student ID" value={`${26 - Math.min(4, Math.ceil(education.totalCredits / 35))}00${account.id.slice(-4).toUpperCase()}`} />
          <InfoItem label="University Email" value={account.email} />
          <InfoItem label="Major Program" value="Computer Science" />
          <InfoItem label="Graduation Status" value={progressPct >= 90 ? "Ready for Graduation" : "On Track"} />
          <InfoItem label="Academic Standing" value={cumGPA >= 3.0 ? "Good Standing" : (cumGPA >= 2.0 ? "Satisfactory" : "Probation")} />
          <InfoItem
            label="Current Load"
            value={registration?.status === 'Approved' ? `${calculateCredits(registration)} Credits` : "0 Credits"}
          />
          <InfoItem label="Total Semesters" value={`${education.numSemesters} Semesters`} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [settings, setSettings] = useState<SettingsState>(() =>
    getStoredSettings<SettingsState>(defaultSettings())
  );

  const initial = (userName?.charAt(0) ?? '').toUpperCase();

  // Side-effect handler for settings changes
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => watchSystemTheme(), []);

  const upd = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [k]: v }));
  };

  const handleExport = async () => {
    if (!userEmail) return;
    const success = await exportAcademicData(userEmail);
    if (success) {
      alert("Data exported successfully! Check your downloads folder.");
    } else {
      alert("Failed to export data. Please try again later.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Notifications */}
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3 flex items-center gap-1.5"><Bell size={12} /> Notifications</p>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4">
          <SRow label="Email Notifications" desc="Receive system emails"><Toggle id="t-email" checked={settings.emailNotifications} onChange={v => upd('emailNotifications', v)} /></SRow>
          <SRow label="Schedule Approval Alerts" desc="Show pending/approved alerts for your schedule in your profile"><Toggle id="t-sched" checked={settings.scheduleApprovalAlerts} onChange={v => upd('scheduleApprovalAlerts', v)} /></SRow>
        </div>
      </section>

      {/* Appearance */}
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3 flex items-center gap-1.5"><Sun size={12} /> Appearance</p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Website Mode</p>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map(t => (
            <button key={t} onClick={() => upd('theme', t)}
              className={`flex-1 py-2 rounded-lg border text-xs font-bold capitalize transition-all ${settings.theme === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </section>


      {/* Data & Privacy */}
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3 flex items-center gap-1.5"><Eye size={12} /> Data & Privacy</p>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4">
          <SRow label="Auto-Save Drafts" desc="Persist manual course selections across refreshes"><Toggle id="t-autosave" checked={settings.autoSaveDrafts} onChange={v => upd('autoSaveDrafts', v)} /></SRow>
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Download Academic Data</p>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Export your transcript and schedule as a PDF.</p>
              </div>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                <Download size={14} className="text-blue-500" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3 flex items-center gap-1.5"><Shield size={12} /> Security</p>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4">
          <SRow label="Remember Session" desc="Stay logged in for 7 days"><Toggle id="t-session" checked={settings.sessionRemember} onChange={v => upd('sessionRemember', v)} /></SRow>
        </div>
      </section>


    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
const SIDEBAR = [
  { tab: 'profile' as ModalTab, label: 'Profile', Icon: User },
  { tab: 'settings' as ModalTab, label: 'Settings', Icon: Settings },
];

export default function ProfileSettingsModal({ open, defaultTab = 'profile', onClose }: Props) {
  const [tab, setTab] = useState<ModalTab>(defaultTab);
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const [showRegistrationAlerts, setShowRegistrationAlerts] = useState(true);

  // Read settings
  useEffect(() => {
    const s = getStoredSettings<SettingsState>(defaultSettings());
    setShowRegistrationAlerts(s.scheduleApprovalAlerts !== false);
    syncStoredTheme();
  }, [open]);

  // Handle smooth entry/exit animations (400ms)
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Sync tab when caller changes defaultTab
  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  // Fetch data when modal opens
  useEffect(() => {
    if (!open) return;
    const token = getToken();
    if (!token) return;
    const user = parseJwt(token);
    if (!user) return;
    setUserName(user.name || '');
    setUserEmail(user.email || '');
    if (student) return; // already loaded
    setLoading(true);
    Promise.all([
      getStudentByEmail(user.email),
      getMyRegistration().catch(() => null),
    ]).then(([s, r]) => {
      setStudent(s);
      setRegistration(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, student]);

  // Close on Escape
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  useEffect(() => {
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  // Lock body scroll while modal is open — hide scrollbar thumb but prevent layout jump
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop — smooth fade */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-400 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Modal — smooth fade and zoom in/out */}
      <div
        className={`relative z-10 bg-white dark:bg-slate-900 rounded-2xl w-full max-w-7xl h-[700px] flex overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl transition-all duration-400 ease-in-out ${isVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95'
          }`}
        style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.12), 0 12px 40px rgba(0,0,0,0.18), 0 40px 100px rgba(0,0,0,0.10)' }}
      >

        {/* Left Sidebar */}
        <div className="w-56 flex-shrink-0 bg-slate-50 dark:bg-slate-900/70 border-r border-slate-100 dark:border-slate-800 p-3 flex flex-col">
          <div className="mb-3 px-2 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">Account</p>
          </div>
          <nav className="space-y-1">
            {SIDEBAR.map(({ tab: t, label, Icon }) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left ${tab === t
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                <Icon size={16} className={tab === t ? 'text-blue-500' : 'text-slate-400 dark:text-slate-400'} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <button onClick={() => { removeToken(); window.location.href = '/'; }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors text-left">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content header */}
          <div className="relative flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div className="max-w-3xl mx-auto w-full text-left">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">{tab}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                {tab === 'profile' ? 'Your academic profile and transcript' : 'Manage your preferences and account'}
              </p>
            </div>
            <button onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-3xl mx-auto">
              {loading ? (
                <div className="animate-pulse space-y-6">
                  {/* Header Skeleton */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800" />
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-24 bg-slate-50 dark:bg-slate-900/70 rounded" />
                    </div>
                  </div>
                  {/* Stats Grid Skeleton */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-16 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800" />
                    ))}
                  </div>
                  {/* Progress Skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between"><div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" /><div className="h-3 w-32 bg-slate-50 dark:bg-slate-900/70 rounded" /></div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  </div>
                  {/* Registration Skeleton */}
                  <div className="h-32 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800" />
                  {/* Info Items Skeleton */}
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-14 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl" />
                    ))}
                  </div>
                </div>
              ) : tab === 'profile' ? (
                student
                  ? <ProfilePanel student={student} registration={registration} userName={userName} userEmail={userEmail} showRegistrationAlerts={showRegistrationAlerts} />
                  : <p className="text-red-500 text-sm">Could not load profile data.</p>
              ) : (
                <SettingsPanel userName={userName} userEmail={userEmail} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
