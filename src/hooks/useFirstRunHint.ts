import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hasSeenScrollHint';

/**
 * Design spec §6.4: appears 1.5s after Scene 0 loads, auto-dismisses on the
 * first scroll event or the close button, never shown again once dismissed
 * (persisted to localStorage). If localStorage is unavailable, the hint just
 * won't persist across reloads rather than throwing (design spec §10).
 */
export function useFirstRunHint(delayMs = 1500): { visible: boolean; dismiss: () => void } {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hasSeen = false;
    try {
      hasSeen = window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      hasSeen = false;
    }
    if (hasSeen) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable — degrade gracefully.
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener('wheel', dismiss, { once: true });
    window.addEventListener('touchmove', dismiss, { once: true });
    window.addEventListener('scroll', dismiss, { once: true, capture: true });
    return () => {
      window.removeEventListener('wheel', dismiss);
      window.removeEventListener('touchmove', dismiss);
      window.removeEventListener('scroll', dismiss, { capture: true });
    };
  }, [visible, dismiss]);

  return { visible, dismiss };
}
