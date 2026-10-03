import { useCallback } from 'react';
import { REDUCED_MOTION_PROGRESS as CASCADE_SNAPSHOTS } from '../../lib/cascade';
import { REDUCED_MOTION_PROGRESS as CYTOLYSIS_SNAPSHOTS } from '../../lib/cytolysis';
import { REDUCED_MOTION_PROGRESS as RENAL_SNAPSHOTS } from '../../lib/renal';
import { REDUCED_MOTION_PROGRESS as SCENE5_SNAPSHOTS } from '../../lib/scene5';
import { REDUCED_MOTION_PROGRESS as SYSTEMIC_SNAPSHOTS } from '../../lib/systemic';
import { stepIndexFromProgress } from '../../lib/steps';
import { useAppStore } from '../../store/useAppStore';
import { tlsContent } from '../../content/tls';

/** Per scene, the local progress shown for each step under reduced motion (a still snapshot instead of an animation). */
const SNAPSHOTS: Record<number, readonly number[]> = {
  0: [0, 0, 0],
  1: CYTOLYSIS_SNAPSHOTS,
  2: CASCADE_SNAPSHOTS,
  3: RENAL_SNAPSHOTS,
  4: SYSTEMIC_SNAPSHOTS,
  5: SCENE5_SNAPSHOTS,
};

/** Snaps a position on the timeline to the still snapshot of the step it falls in. */
export function snapToStep(g: number): number {
  const index = Math.max(0, Math.min(tlsContent.scenes.length - 1, Math.floor(g)));
  const scene = tlsContent.scenes[index];
  const step = stepIndexFromProgress(g - index, scene.steps.length);
  return index + (SNAPSHOTS[index]?.[step] ?? 0);
}

/**
 * Reads the experience's position (scene units) for the 3D scenes. Under reduced motion it jumps between per-step
 * snapshots rather than following the scroll continuously. Stable identity: safe in effect/frame dependencies.
 */
export function useGetG(reducedMotion: boolean): () => number {
  return useCallback(() => {
    const g = useAppStore.getState().globalProgress;
    return reducedMotion ? snapToStep(g) : g;
  }, [reducedMotion]);
}
