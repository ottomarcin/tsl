import type { InterventionDefinition, InterventionStateMap, MetricValueMap } from '../content/schema';
import { stepIndexFromProgress } from './steps';

/**
 * Scene 5 as pure functions: which interventions each step puts on show, how far the cascade has run at a point on the
 * timeline (the viewer can scrub it), and what the 3D scene should show for a given set of interventions. The numbers
 * come from the interventions' own effect functions (content package), so the picture and the lab strip agree.
 */

export const SCENE5_INDEX = 5;
export const SCENE5_STEPS = 6;
/** Index of the free-play step (5.6): the viewer's own settings apply. */
export const FREE_PLAY_STEP = 5;
/** Hydration on the 0–1 slider scale that is shown in step 5.4: 2.5 L/m²/day of the 0–4 range, the middle of the 2–3 target. */
export const DEMO_HYDRATION = 0.625;
/** The slider's top end in L/m²/day (design spec §5.7). */
export const HYDRATION_MAX_LITRES = 4;
/** The cascade, from T+0h to the time shown by the peak labs. */
export const SCENE5_HOURS = 48;
/** Cascade progress (Scene 2's scale) at the end of the scrubber: short of 1, where the crystals have not all been absorbed yet. */
export const CASCADE_PEAK_PROGRESS = 0.9;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Step (0-based) of Scene 5 at a point on the timeline; before the scene it is the first step (the rewind). */
export function scene5Step(g: number): number {
  if (g < SCENE5_INDEX) return 0;
  return stepIndexFromProgress(g - SCENE5_INDEX, SCENE5_STEPS);
}

/**
 * How far the cascade has run, 0 (T+0h, idle) to 1 (peak). The first step shows the baseline; the cascade then runs
 * across most of step 5.2 (the time marker moves with the scroll), so the viewer sees what the therapy acts on.
 */
export function cascadeTime(g: number): number {
  if (g < SCENE5_INDEX) return 0;
  return smooth(clamp01((g - SCENE5_INDEX - 1 / SCENE5_STEPS) / CASCADE_RUN));
}

/** Share of the scene (local progress) over which the cascade runs, starting where step 5.2 starts. */
const CASCADE_RUN = 0.13;

/** Where Scene 2's cascade stands (0–1 of its own scale) at cascade time `tau`. */
export function cascadeProgressFor(tau: number): number {
  return CASCADE_PEAK_PROGRESS * clamp01(tau);
}

/**
 * Local progress shown for each step under reduced motion: the first is the idle baseline, the rest are past the point
 * where the cascade has run (so the effects show as final states, not as a replay).
 */
export const REDUCED_MOTION_PROGRESS = [0, 0.3, 0.46, 0.62, 0.8, 0.95] as const;

/** Interventions that are on in each step: 5.1 none, then one at a time, then whatever the viewer sets (5.6). */
export function interventionsForStep(step: number, free: InterventionStateMap): InterventionStateMap {
  switch (step) {
    case 1:
      return { rasburicase: true };
    case 2:
      return { allopurinol: true };
    case 3:
      return { hydration: DEMO_HYDRATION };
    case 4:
      return { dialysis: true };
    case FREE_PLAY_STEP:
      return free;
    default:
      return {};
  }
}

export function foldCounterfactual(
  baseline: MetricValueMap,
  state: InterventionStateMap,
  interventions: InterventionDefinition[],
): MetricValueMap {
  return interventions.reduce((acc, def) => def.applyEffect(acc, state), { ...baseline });
}

/**
 * The lab strip in Scene 5: from the T+0 values (cascade time 0) to the counterfactual peak (time 1). Illustrative:
 * a straight line between the two, as the formulas only describe the end point.
 */
export function labsAt(
  tau: number,
  start: MetricValueMap,
  peak: MetricValueMap,
  state: InterventionStateMap,
  interventions: InterventionDefinition[],
): MetricValueMap {
  const end = foldCounterfactual(peak, state, interventions);
  const t = clamp01(tau);
  const out: MetricValueMap = {};
  for (const id of Object.keys(end)) out[id] = (start[id] ?? end[id]) + (end[id] - (start[id] ?? end[id])) * t;
  return out;
}

/** The time shown on the strip for cascade time `tau`. */
export function hoursLabel(tau: number): string {
  return `T+${Math.round(clamp01(tau) * SCENE5_HOURS)}h`;
}

export interface InterventionEffects {
  /** Share of the calcium-phosphate crystals that still form (1 = untreated). */
  caphosShare: number;
  /** Share of the uric-acid crystals that still form. */
  uricShare: number;
  /** How much of the purine stream is lost at its intercept point (0 = none). */
  purineLoss: number;
  /** Which drug does it: rasburicase dissolves what is there, allopurinol stops it forming. */
  purineAction: 'dissolve' | 'block' | null;
  /** Multiplier on how fast the streams flow. */
  flowSpeed: number;
  /** 0–1: dialysis circuit running. */
  dialysis: number;
}

/**
 * What the 3D scene shows for a set of interventions: crystal shares and the stream's loss follow the effect
 * functions (the untreated peak against the treated one), flow speed follows hydration (asset spec §7.2).
 */
export function effectsFor(peak: MetricValueMap, state: InterventionStateMap, interventions: InterventionDefinition[]): InterventionEffects {
  const treated = foldCounterfactual(peak, state, interventions);
  const drugOnly = foldCounterfactual(peak, { rasburicase: state.rasburicase, allopurinol: state.allopurinol }, interventions);
  const hydration = typeof state.hydration === 'number' ? clamp01(state.hydration) : 0;
  const purineLoss = clamp01(1 - drugOnly.UA / peak.UA);
  return {
    caphosShare: clamp01(treated.PO4 / peak.PO4),
    uricShare: clamp01(treated.UA / peak.UA),
    purineLoss,
    purineAction: purineLoss <= 0 ? null : state.rasburicase === true ? 'dissolve' : 'block',
    flowSpeed: 1 + hydration * 0.5,
    dialysis: state.dialysis === true ? 1 : 0,
  };
}

/** Which badges are on screen in a step: each appears with its step and stays; free play has all four. */
export function badgesShown(step: number): Record<'rasburicase' | 'allopurinol' | 'hydration' | 'dialysis', boolean> {
  return {
    rasburicase: step >= 1,
    allopurinol: step >= 2,
    hydration: step >= 3,
    dialysis: step >= 4,
  };
}

/** Whether an intervention is on in a state (the hydration slider counts as on above zero). */
export function isOn(id: string, state: InterventionStateMap): boolean {
  return id === 'hydration' ? typeof state.hydration === 'number' && state.hydration > 0 : state[id] === true;
}
