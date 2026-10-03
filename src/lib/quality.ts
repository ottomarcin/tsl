import type { ModelQuality } from '../content/schema';

const STORAGE_KEY = 'modelQuality';

function isQuality(v: string | null): v is ModelQuality {
  return v === 'high' || v === 'standard';
}

/**
 * ?quality=high|standard in the URL wins (handy for testing and sharing a link), then the saved choice,
 * then 'high' (the default tier).
 */
export function resolveInitialQuality(search: string): ModelQuality {
  const fromUrl = new URLSearchParams(search).get('quality');
  if (isQuality(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isQuality(stored)) return stored;
  } catch {
    // localStorage unavailable — fall through to the default.
  }
  return 'high';
}

export function persistQuality(quality: ModelQuality): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, quality);
  } catch {
    // localStorage unavailable — the choice just won't survive a reload.
  }
}
