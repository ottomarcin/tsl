import { useEffect } from 'react';

/** Browser noise that is not an app failure and must not raise a toast. */
const IGNORED = /ResizeObserver loop|Script error\.?$/i;

/**
 * Calls `onError` for an uncaught error or an unhandled promise rejection anywhere in the page. Failed model downloads
 * have their own message (and R3F also leaves an unhandled rejection behind for them): those are skipped here.
 */
export function useGlobalErrors(onError: (error: unknown) => void): void {
  useEffect(() => {
    const message = (e: unknown) => (e instanceof Error ? e.message : String(e ?? ''));
    const handle = (raw: unknown) => {
      const text = message(raw);
      if (IGNORED.test(text) || /Could not load|Failed to fetch|NetworkError|Load failed/i.test(text)) return;
      onError(raw);
    };
    const onWindowError = (e: ErrorEvent) => handle(e.error ?? e.message);
    const onRejection = (e: PromiseRejectionEvent) => handle(e.reason);
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [onError]);
}
