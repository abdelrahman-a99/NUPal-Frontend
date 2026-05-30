export const SETTINGS_KEY = 'nupal_student_settings';

export type Theme = 'light' | 'dark' | 'system';

export interface StoredSettings {
  theme?: Theme;
  compactMode?: boolean;
  reducedMotion?: boolean;
  [key: string]: unknown;
}

export function getStoredSettings<T extends { theme?: Theme } = StoredSettings>(fallback?: T): T {
  const base = (fallback ?? {}) as T;

  if (typeof window === 'undefined') return base;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw) } as T;
  } catch {
    return base;
  }
}

export function getStoredTheme(): Theme {
  const settings = getStoredSettings();
  return settings.theme ?? 'system';
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return theme === 'dark' ? 'dark' : 'light';

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return theme;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const isDark = resolveTheme(theme) === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('dark-mode', isDark);
}

export function saveSettings<T extends { theme?: Theme }>(settings: T): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  if (settings.theme) applyTheme(settings.theme);
  window.dispatchEvent(new CustomEvent('nupal-settings-updated', { detail: settings }));
}

export function saveTheme(theme: Theme): void {
  const next = { ...getStoredSettings(), theme };
  saveSettings(next);
}

export function syncStoredTheme(): void {
  applyTheme(getStoredTheme());
}

export function watchSystemTheme(onChange?: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
      onChange?.();
    }
  };

  media.addEventListener?.('change', handler);
  return () => media.removeEventListener?.('change', handler);
}
