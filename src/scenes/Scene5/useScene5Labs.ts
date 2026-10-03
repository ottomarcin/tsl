import { useEffect } from 'react';
import { tlsInterventions } from '../../content/tls/interventions';
import { SCENE5_INDEX, cascadeTime, hoursLabel, interventionsForStep, labsAt } from '../../lib/scene5';
import { useAppStore } from '../../store/useAppStore';
import { BASELINE_LABS, PEAK_LABS } from '../shared/scene5State';

/** Where the story has the cascade (0–1), as a hundredth so that the interface re-renders at most 100 times over a run. */
export function useStoryTime(): number {
  return useAppStore((s) => Math.round(cascadeTime(SCENE5_INDEX + s.sceneProgress) * 100) / 100);
}

/** How far the cascade has run as the viewer sees it: where the story has it, unless they have scrubbed. */
export function displayedTime(story: number, scrub: number | null): number {
  return scrub ?? story;
}

/**
 * Scene 5's lab strip is computed, not authored: the T+0 labs move to the counterfactual peak with the interventions
 * that are on and the time the viewer has scrubbed to. Returns the timestamp to show beside it.
 */
export function useScene5Labs(enabled: boolean, stepIndex: number): string | undefined {
  const scrub = useAppStore((s) => s.scrub);
  const free = useAppStore((s) => s.interventionState);
  const setLabValues = useAppStore((s) => s.setLabValues);
  const tau = displayedTime(useStoryTime(), scrub);
  useEffect(() => {
    if (!enabled) return;
    setLabValues(labsAt(tau, BASELINE_LABS, PEAK_LABS, interventionsForStep(stepIndex, free), tlsInterventions));
  }, [enabled, tau, stepIndex, free, setLabValues]);
  // A new step starts from the story's own timeline again.
  const setScrub = useAppStore((s) => s.setScrub);
  useEffect(() => {
    if (enabled) setScrub(null);
  }, [enabled, stepIndex, setScrub]);
  return enabled ? hoursLabel(tau) : undefined;
}
