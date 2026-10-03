import type { ScrollStep } from '../content/schema';

/** Maps 0–1 progress within a scene to the active step index; progress is split into equal bands. */
export function stepIndexFromProgress(progress: number, stepCount: number): number {
  if (stepCount <= 1) return 0;
  const clamped = Math.max(0, Math.min(1, progress));
  return Math.min(stepCount - 1, Math.floor(clamped * stepCount));
}

/** The most recent timestamp at or before `index` — steps without their own timestamp inherit the previous one. */
export function latestTimestamp(steps: ScrollStep[], index: number): string | undefined {
  for (let i = Math.min(index, steps.length - 1); i >= 0; i--) {
    if (steps[i].timestamp) return steps[i].timestamp;
  }
  return undefined;
}
