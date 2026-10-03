import type { InterventionDefinition, MetricValueMap, InterventionStateMap } from '../schema';

function toRate(state: InterventionStateMap, key: string): number {
  const v = state[key];
  return typeof v === 'number' ? v : 0;
}

function toOn(state: InterventionStateMap, key: string): boolean {
  return state[key] === true;
}

/**
 * All four effect functions are designed to compose via a left fold over this
 * exact array order (Rasburicase → Allopurinol → Hydration → Dialysis), each
 * receiving the running accumulator as its `baseline` parameter — see
 * tls_technical_architecture.md §8.1's `(baseline, state) => result` contract.
 *
 * Deliberate interpretation of tls_asset_specification.md §7.2's combined
 * pseudocode, decomposed into independently composable per-intervention
 * functions (documented here since the source pseudocode is illustrative,
 * not a literal contract — see the two notes below):
 *
 * 1. Rasburicase/Allopurinol combination: the source pseudocode computes both
 *    from the ORIGINAL baseline and lets the later `if` silently overwrite the
 *    earlier one — an artifact of the pseudocode's flat structure, not a
 *    deliberate clinical claim. Given the design spec's own prose ("combining
 *    the two is rarely indicated... rasburicase is preferred... works on both
 *    the existing pool and ongoing production"), this implementation instead
 *    has Allopurinol defer to Rasburicase when both are active (via the shared
 *    `state` parameter each function receives) — rasburicase's effect wins,
 *    allopurinol adds nothing further. This is order-independent and
 *    composable, unlike the source's overwrite-by-array-position behavior.
 * 2. Hydration/Dialysis Ca²⁺ rebound: the source computes
 *    `cf.Ca = baseline.Ca + (baseline.PO4 - cf.PO4) * 0.2` once, after all PO4
 *    changes. Decomposed here so each step that reduces PO4 (hydration,
 *    dialysis) bumps Ca proportionally to the PO4 delta *it* introduces. Since
 *    these deltas telescope ((po4_0 − po4_1) + (po4_1 − po4_2) = po4_0 − po4_2),
 *    the summed Ca rebound across both steps equals the source formula's
 *    single combined computation exactly.
 */

const rasburicase: InterventionDefinition = {
  id: 'rasburicase',
  label: 'Rasburicase',
  cascadeBranchId: 'purines',
  cascadePositionT: 0.9, // just past the purine tube's uric-acid-to-allantoin conversion point
  controlType: 'toggle',
  applyEffect(baseline: MetricValueMap, state: InterventionStateMap): MetricValueMap {
    if (!toOn(state, 'rasburicase')) return baseline;
    return { ...baseline, UA: baseline.UA * 0.3 };
  },
};

const allopurinol: InterventionDefinition = {
  id: 'allopurinol',
  label: 'Allopurinol / Febuxostat',
  cascadeBranchId: 'purines',
  cascadePositionT: 0.75, // the second XO enzyme node, between xanthine and uric acid
  controlType: 'toggle',
  applyEffect(baseline: MetricValueMap, state: InterventionStateMap): MetricValueMap {
    if (!toOn(state, 'allopurinol')) return baseline;
    if (toOn(state, 'rasburicase')) return baseline; // rasburicase already dominates
    return { ...baseline, UA: baseline.UA * 0.5 };
  },
};

const hydration: InterventionDefinition = {
  id: 'hydration',
  label: 'IV hydration',
  cascadeBranchId: 'PO4', // positioned at the convergence point entering the kidney, approximated here
  cascadePositionT: 1.0,
  controlType: 'slider',
  slider: { max: 4, unit: 'L/m²/day' },
  applyEffect(baseline: MetricValueMap, state: InterventionStateMap): MetricValueMap {
    const rate = toRate(state, 'hydration');
    if (rate <= 0) return baseline;
    const factor = 1 - rate * 0.4;
    const crFactor = 1 - rate * 0.3;
    const newPO4 = baseline.PO4 * factor;
    const caRebound = (baseline.PO4 - newPO4) * 0.2;
    return {
      ...baseline,
      K: baseline.K * factor,
      PO4: newPO4,
      UA: baseline.UA * factor,
      Cr: baseline.Cr * crFactor,
      Ca: baseline.Ca + caRebound,
    };
  },
};

const dialysis: InterventionDefinition = {
  id: 'dialysis',
  label: 'Dialysis (RRT)',
  cascadeBranchId: 'PO4', // positioned at the kidney silhouette itself, approximated here
  cascadePositionT: 1.0,
  controlType: 'toggle',
  applyEffect(baseline: MetricValueMap, state: InterventionStateMap): MetricValueMap {
    if (!toOn(state, 'dialysis')) return baseline;
    const newK = Math.min(baseline.K, 5.0);
    const newPO4 = Math.min(baseline.PO4, 5.0);
    const newUA = Math.min(baseline.UA, 7.0);
    const caRebound = (baseline.PO4 - newPO4) * 0.2;
    return {
      ...baseline,
      K: newK,
      PO4: newPO4,
      UA: newUA,
      Ca: baseline.Ca + caRebound,
    };
  },
};

// Canonical composition order: fold over this array left-to-right.
export const tlsInterventions: InterventionDefinition[] = [rasburicase, allopurinol, hydration, dialysis];

/** Convenience orchestration used by tests now and by the Scene 5 InterventionPanel later. */
export function computeCounterfactual(
  baseline: MetricValueMap,
  state: InterventionStateMap,
  interventions: InterventionDefinition[] = tlsInterventions,
): MetricValueMap {
  return interventions.reduce((acc, def) => def.applyEffect(acc, state), { ...baseline });
}
