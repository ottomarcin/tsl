import { describe, expect, it } from 'vitest';
import { computeCounterfactual } from './interventions';

/**
 * The counterfactual formula of asset spec §7.2, written out literally as the spec has it, as an independent check on
 * the composable implementation. The one deliberate difference: when rasburicase and allopurinol are both on, the
 * spec's pseudocode lets the later `if` overwrite the earlier, so allopurinol (×0.5) would undo rasburicase (×0.3);
 * here rasburicase wins (documented in interventions.ts and clinical review S5.6).
 */
function specFormula(b: Record<string, number>, s: { rasburicase: boolean; allopurinol: boolean; hydration: number; dialysis: boolean }) {
  const cf = { ...b };
  if (s.rasburicase) cf.UA = b.UA * 0.3;
  if (s.allopurinol && !s.rasburicase) cf.UA = b.UA * 0.5;
  if (s.hydration > 0) {
    const factor = 1 - s.hydration * 0.4;
    cf.K = b.K * factor;
    cf.PO4 = b.PO4 * factor;
    cf.UA = cf.UA * factor;
    cf.Cr = b.Cr * (1 - s.hydration * 0.3);
  }
  if (s.dialysis) {
    cf.K = Math.min(cf.K, 5.0);
    cf.PO4 = Math.min(cf.PO4, 5.0);
    cf.UA = Math.min(cf.UA, 7.0);
  }
  cf.Ca = b.Ca + (b.PO4 - cf.PO4) * 0.2;
  return cf;
}

const baseline = { K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 };
const bools = [false, true];
const rates = [0, 0.025, 0.25, 0.5, 0.625, 0.75, 1];

describe('free play: every combination of the controls matches the spec formula', () => {
  for (const rasburicase of bools)
    for (const allopurinol of bools)
      for (const dialysis of bools)
        for (const hydration of rates) {
          it(`rasburicase=${rasburicase} allopurinol=${allopurinol} dialysis=${dialysis} hydration=${hydration}`, () => {
            const got = computeCounterfactual(baseline, { rasburicase, allopurinol, dialysis, hydration });
            const want = specFormula(baseline, { rasburicase, allopurinol, hydration, dialysis });
            for (const id of Object.keys(baseline)) expect(got[id]).toBeCloseTo(want[id], 9);
          });
        }

  it('never makes a lab worse, and never moves creatinine except through hydration', () => {
    for (const rasburicase of bools)
      for (const allopurinol of bools)
        for (const dialysis of bools)
          for (const hydration of rates) {
            const got = computeCounterfactual(baseline, { rasburicase, allopurinol, dialysis, hydration });
            expect(got.K).toBeLessThanOrEqual(baseline.K);
            expect(got.PO4).toBeLessThanOrEqual(baseline.PO4);
            expect(got.UA).toBeLessThanOrEqual(baseline.UA);
            expect(got.Ca).toBeGreaterThanOrEqual(baseline.Ca);
            if (hydration === 0) expect(got.Cr).toBe(baseline.Cr);
          }
  });

  it('adding an intervention never makes the result worse than without it', () => {
    for (const hydration of rates)
      for (const dialysis of bools)
        for (const [on, off] of [
          [{ rasburicase: true, allopurinol: false }, { rasburicase: false, allopurinol: false }],
          [{ rasburicase: false, allopurinol: true }, { rasburicase: false, allopurinol: false }],
          [{ rasburicase: true, allopurinol: true }, { rasburicase: false, allopurinol: true }],
        ] as const) {
          const a = computeCounterfactual(baseline, { ...on, dialysis, hydration });
          const b = computeCounterfactual(baseline, { ...off, dialysis, hydration });
          expect(a.UA).toBeLessThanOrEqual(b.UA + 1e-12);
        }
  });
});
