import type { Theme } from '../store/types';

const STORAGE_KEY = 'theme';

function safeLocalStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (private browsing, disabled) — degrade silently.
  }
}

/**
 * localStorage → prefers-color-scheme → dark default (design spec §3.1.2).
 *
 * This algorithm is also duplicated as a tiny inline <script> in index.html's
 * <head>, which runs before any bundle loads so the first paint already
 * matches the resolved theme. Keep both copies in sync.
 */
export function resolveInitialTheme(): Theme {
  const stored = safeLocalStorageGet(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Reads the theme the inline head script already resolved and set on <html data-theme>. */
export function readDomTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' ? 'light' : 'dark';
}

export function persistTheme(theme: Theme): void {
  safeLocalStorageSet(STORAGE_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}
