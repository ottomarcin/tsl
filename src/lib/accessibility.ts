const STORAGE_KEY = 'textOnlyMode';

/** The saved choice of the text-only mode (off by default; off when storage is unavailable). */
export function resolveInitialTextOnly(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistTextOnly(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(on));
  } catch {
    // Storage unavailable: the choice just won't survive a reload.
  }
}
