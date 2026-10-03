import { useEffect, useRef } from 'react';

/** Spec: a connection that has not delivered after 30 seconds is treated as timed out. */
export const LOAD_TIMEOUT_MS = 30_000;

/**
 * Calls `onTimeout` once if loading stays active for `timeoutMs` without a break. Loading that finishes (even if more
 * starts later) restarts the clock, so only a single stuck load counts.
 */
export function useLoadTimeout(loading: boolean, onTimeout: () => void, timeoutMs = LOAD_TIMEOUT_MS): void {
  const callback = useRef(onTimeout);
  callback.current = onTimeout;
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => callback.current(), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [loading, timeoutMs]);
}
