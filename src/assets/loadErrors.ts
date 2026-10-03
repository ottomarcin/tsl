/**
 * Model download failures, reported once for the whole app: every ModelBoundary that catches one calls
 * `reportModelError`, and the app turns the first into a toast whose Retry clears the failed downloads from the cache
 * and lets each boundary try again.
 */
type Listener = (error: Error) => void;

const listeners = new Set<Listener>();
const retries = new Set<() => void>();

export function onModelError(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportModelError(error: Error, retry: () => void): void {
  retries.add(retry);
  listeners.forEach((l) => l(error));
}

/** Retries every boundary that failed (after the failed downloads have been cleared from the cache). */
export function retryModelErrors(): void {
  const pending = [...retries];
  retries.clear();
  pending.forEach((retry) => retry());
}
