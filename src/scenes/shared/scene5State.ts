import { tlsContent } from '../../content/tls';
import { tlsInterventions } from '../../content/tls/interventions';
import { cascadeProgressFor, cascadeTime, effectsFor, interventionsForStep, scene5Step, type InterventionEffects } from '../../lib/scene5';
import { localProgress } from '../../lib/timeline';
import { labValuesAt } from '../../lib/steps';
import { useAppStore } from '../../store/useAppStore';

/** The untreated peak: the labs at the end of Scene 4, which the counterfactuals start from. */
const lastStep4 = tlsContent.scenes[4].steps.length - 1;
export const PEAK_LABS = labValuesAt(tlsContent.scenes, 4, lastStep4);
/** T+0 labs, as the rewind shows them. */
export const BASELINE_LABS = labValuesAt(tlsContent.scenes, 5, 0);

/** Where the cascade stands for the 3D scene at `g`: Scene 2's own progress, then, from Scene 4 on, the rewound one. */
export function cascadeProgressAt(g: number): number {
  if (g < 4) return localProgress(g, 2);
  const scrub = useAppStore.getState().scrub;
  return cascadeProgressFor(g >= 5 && scrub !== null ? scrub : cascadeTime(g));
}

/** Which interventions are on at `g` (by step, or the viewer's own in free play). */
export function activeInterventions(g: number) {
  return interventionsForStep(scene5Step(g), useAppStore.getState().interventionState);
}

/** What the 3D scene should show at `g`. */
export function effectsAt(g: number): InterventionEffects {
  return effectsFor(PEAK_LABS, activeInterventions(g), tlsInterventions);
}
