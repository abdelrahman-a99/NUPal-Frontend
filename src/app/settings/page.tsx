'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, parseJwt, removeToken } from '@/lib/auth';
import { exportAcademicData } from '@/lib/exportData';
import { type Theme, applyTheme, getStoredSettings, saveSettings, watchSystemTheme } from '@/lib/theme';
import {
    Settings, Bell, Lock, Eye, EyeOff, Moon, Sun, Monitor,
    Globe, Shield, Smartphone, ChevronRight, Save, Check,
    LogOut, Trash2, AlertTriangle, BookOpen, Mail, Download, Link
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Language = 'en' | 'ar';

interface SettingsState {
    // Notifications
    emailNotifications: boolean;
    scheduleApprovalAlerts: boolean;
    // Appearance
    theme: Theme;
    autoSaveDrafts: boolean;
    // Accessibility
    language: Language;
    // Security
    sessionRemember: boolean;
}

function loadSettings(): SettingsState {
    return getStoredSettings<SettingsState>(defaultSettings());
}

function defaultSettings(): SettingsState {
    return {
        emailNotifications: true,
        scheduleApprovalAlerts: true,
        theme: 'system',
        autoSaveDrafts: true,
        language: 'en',
        sessionRemember: true,
    };
}



function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
    return (
        <button
            id={id}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );
}

function SectionCard({ title, description, icon: Icon, children }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-5">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl">
                    <Icon size={18} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}</h3>
                    {description && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">{children}</div>
        </div>
    );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between px-6 py-4">
            <div className="mr-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                {description && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 leading-snug max-w-xs">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function ThemeButton({ icon: Icon, label, value, current, onClick }: any) {
    const active = current === value;
    return (
        <button
            onClick={() => onClick(value)}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                active ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );
}


export default function SettingsPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [settings, setSettings] = useState<SettingsState>(defaultSettings());
    const [showDangerZone, setShowDangerZone] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const user = parseJwt(token);
        if (!user) { removeToken(); router.push('/login'); return; }
        if (user.role === 'admin') { router.push('/admin'); return; }
        setUserName(user.name || '');
        setUserEmail(user.email || '');
        const loaded = loadSettings();
        setSettings(loaded);
        applyTheme(loaded.theme);
    }, [router]);


    useEffect(() => watchSystemTheme(), []);

    const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            saveSettings(next);
            return next;
        });
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

    const initial = (userName?.charAt(0) ?? '').toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/70">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-16 z-10">
                <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                            <Settings size={20} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Settings</h1>
                            <p className="text-xs text-slate-400 dark:text-slate-400">Manage your account preferences</p>
                        </div>
                    </div>

                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8">

                {/* Account Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 flex items-center gap-5 shadow-xl">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-2xl font-black text-white">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-lg leading-tight truncate">{userName}</p>
                        <p className="text-slate-400 dark:text-slate-400 text-sm mt-0.5 truncate">{userEmail}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bg-blue-500/20 text-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">Student</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <SectionCard title="Notifications" description="Choose what alerts you receive" icon={Bell}>
                    <SettingRow label="Email Notifications" description="Receive system emails for important updates">
                        <Toggle id="toggle-email-notif" checked={settings.emailNotifications} onChange={v => update('emailNotifications', v)} />
                    </SettingRow>
                    <SettingRow label="Schedule Approval Alerts" description="Show pending/approved alerts for your schedule in your profile">
                        <Toggle id="toggle-schedule-alerts" checked={settings.scheduleApprovalAlerts} onChange={v => update('scheduleApprovalAlerts', v)} />
                    </SettingRow>
                </SectionCard>

                {/* Appearance */}
                <SectionCard title="Appearance" description="Customize how NUPAL looks for you" icon={Sun}>
                    <div className="px-6 py-5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Website Mode</p>
                        <div className="flex gap-3">
                            <ThemeButton icon={Sun} label="Light" value="light" current={settings.theme} onClick={(v: Theme) => update('theme', v)} />
                            <ThemeButton icon={Moon} label="Dark" value="dark" current={settings.theme} onClick={(v: Theme) => update('theme', v)} />
                            <ThemeButton icon={Monitor} label="System" value="system" current={settings.theme} onClick={(v: Theme) => update('theme', v)} />
                        </div>
                    </div>
                    <SettingRow label="Auto-Save Drafts" description="Automatically save your course selections locally so you don't lose them if you refresh the page.">
                        <Toggle id="toggle-autosave" checked={settings.autoSaveDrafts} onChange={v => update('autoSaveDrafts', v)} />
                    </SettingRow>
                </SectionCard>

                {/* Language */}
                <SectionCard title="Language & Region" description="Set your display language" icon={Globe}>
                    <div className="px-6 py-5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Display Language</p>
                        <div className="flex gap-3">
                            {([
                                { value: 'en', label: 'English' },
                                { value: 'ar', label: 'العربية' },
                            ] as { value: Language; label: string }[]).map(lang => (
                                <button
                                    key={lang.value}
                                    onClick={() => update('language', lang.value)}
                                    className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                        settings.language === lang.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">Arabic (RTL) support coming soon.</p>
                    </div>
                </SectionCard>


                {/* Data & Privacy */}
                <SectionCard title="Data & Privacy" description="Manage your data and exports" icon={Eye}>
                    <SettingRow label="Download Academic Data" description="Export a copy of your full academic transcript and registration data as a PDF.">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                            <Download size={16} className="text-blue-500" />
                            Download PDF
                        </button>
                    </SettingRow>
                </SectionCard>

                {/* Security */}
                <SectionCard title="Security" description="Manage your session and account security" icon={Shield}>
                    <SettingRow label="Remember Session" description="Stay logged in for 7 days automatically">
                        <Toggle id="toggle-session" checked={settings.sessionRemember} onChange={v => update('sessionRemember', v)} />
                    </SettingRow>
                </SectionCard>

                {/* Danger Zone */}
                <div className="border border-red-200 dark:border-red-800/60 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setShowDangerZone(v => !v)}
                        className="w-full flex items-center justify-between px-6 py-4 bg-red-50 dark:bg-red-950/40 hover:bg-red-100/50 dark:hover:bg-red-950/50 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={18} className="text-red-500" />
                            <span className="font-bold text-red-700 dark:text-red-300 text-sm">Danger Zone</span>
                        </div>
                        <ChevronRight size={16} className={`text-red-400 transition-transform ${showDangerZone ? 'rotate-90' : ''}`} />
                    </button>
                    {showDangerZone && (
                        <div className="px-6 py-5 bg-white dark:bg-slate-900 border-t border-red-100 dark:border-red-900/50">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                These actions are <strong>irreversible</strong>. Please proceed with caution.
                            </p>
                            <button
                                onClick={() => { removeToken(); window.location.href = '/'; }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-300 dark:border-red-700/60 text-red-600 dark:text-red-300 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            >
                                <LogOut size={15} />
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
