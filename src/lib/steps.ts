import type { SceneDefinition, ScrollStep } from '../content/schema';

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

/**
 * Lab values as they stand at a given point in the story: every step's targets applied in order, from the first
 * scene up to and including `stepIndex` of `sceneIndex`. Makes deep links and skipped steps land on the right numbers.
 */
export function labValuesAt(scenes: SceneDefinition[], sceneIndex: number, stepIndex: number): Record<string, number> {
  const values: Record<string, number> = {};
  for (let s = 0; s <= sceneIndex && s < scenes.length; s++) {
    const steps = scenes[s].steps;
    const last = s === sceneIndex ? stepIndex : steps.length - 1;
    for (let i = 0; i <= last && i < steps.length; i++) {
      for (const target of steps[i].labValues ?? []) values[target.metricId] = target.value;
    }
  }
  return values;
}

/** The timestamp in force at a point in the story: the latest one set at or before it, across scenes. */
export function timestampAt(scenes: SceneDefinition[], sceneIndex: number, stepIndex: number): string | undefined {
  let stamp: string | undefined;
  for (let s = 0; s <= sceneIndex && s < scenes.length; s++) {
    const steps = scenes[s].steps;
    const last = s === sceneIndex ? stepIndex : steps.length - 1;
    for (let i = 0; i <= last && i < steps.length; i++) stamp = steps[i].timestamp ?? stamp;
  }
  return stamp;
}
