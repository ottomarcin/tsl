import { describe, expect, it } from 'vitest';
import { computeCounterfactual, tlsInterventions } from './interventions';
import type { MetricValueMap } from '../schema';

const baseline: MetricValueMap = { K: 6.3, Ca: 7.0, PO4: 7.5, UA: 11.0, Cr: 2.8 };

describe('computeCounterfactual', () => {
  it('returns the baseline unchanged when no interventions are active', () => {
    const cf = computeCounterfactual(baseline, {});
    expect(cf).toEqual(baseline);
  });

  it('rasburicase alone reduces UA to 30% of baseline and touches nothing else', () => {
    const cf = computeCounterfactual(baseline, { rasburicase: true });
    expect(cf.UA).toBeCloseTo(baseline.UA * 0.3);
    expect(cf.K).toBe(baseline.K);
    expect(cf.PO4).toBe(baseline.PO4);
    expect(cf.Ca).toBe(baseline.Ca);
    expect(cf.Cr).toBe(baseline.Cr);
  });

  it('allopurinol alone reduces UA to 50% of baseline', () => {
    const cf = computeCounterfactual(baseline, { allopurinol: true });
    expect(cf.UA).toBeCloseTo(baseline.UA * 0.5);
  });

  it('rasburicase dominates when both rasburicase and allopurinol are active', () => {
    const cf = computeCounterfactual(baseline, { rasburicase: true, allopurinol: true });
    expect(cf.UA).toBeCloseTo(baseline.UA * 0.3);
  });

  it('hydration at full rate reduces K/PO4/UA by 40% and Cr by 30%, and rebounds Ca proportionally', () => {
    const cf = computeCounterfactual(baseline, { hydration: 1 });
    expect(cf.K).toBeCloseTo(baseline.K * 0.6);
    expect(cf.PO4).toBeCloseTo(baseline.PO4 * 0.6);
    expect(cf.UA).toBeCloseTo(baseline.UA * 0.6);
    expect(cf.Cr).toBeCloseTo(baseline.Cr * 0.7);
    const expectedPO4Drop = baseline.PO4 - baseline.PO4 * 0.6;
    expect(cf.Ca).toBeCloseTo(baseline.Ca + expectedPO4Drop * 0.2);
  });

  it('hydration at half rate applies a proportionally smaller reduction', () => {
    const cf = computeCounterfactual(baseline, { hydration: 0.5 });
    expect(cf.K).toBeCloseTo(baseline.K * 0.8);
    expect(cf.PO4).toBeCloseTo(baseline.PO4 * 0.8);
  });

  it('a zero or absent hydration rate is a no-op', () => {
    expect(computeCounterfactual(baseline, { hydration: 0 })).toEqual(baseline);
  });

  it('dialysis alone clamps K/PO4/UA to their ceilings and rebounds Ca from the PO4 drop', () => {
    const cf = computeCounterfactual(baseline, { dialysis: true });
    expect(cf.K).toBe(5.0);
    expect(cf.PO4).toBe(5.0);
    expect(cf.UA).toBe(7.0);
    const expectedPO4Drop = baseline.PO4 - 5.0;
    expect(cf.Ca).toBeCloseTo(baseline.Ca + expectedPO4Drop * 0.2);
  });

  it('dialysis is a no-op on metrics already below their ceiling', () => {
    const mild: MetricValueMap = { K: 4.0, Ca: 9.0, PO4: 3.0, UA: 5.0, Cr: 1.0 };
    const cf = computeCounterfactual(mild, { dialysis: true });
    expect(cf).toEqual(mild);
  });

  it('composes hydration then dialysis so their Ca rebounds sum to the total PO4 drop (telescoping)', () => {
    const cf = computeCounterfactual(baseline, { hydration: 1, dialysis: true });
    const afterHydrationPO4 = baseline.PO4 * 0.6;
    const finalPO4 = Math.min(afterHydrationPO4, 5.0);
    expect(cf.PO4).toBeCloseTo(finalPO4);
    const totalDrop = baseline.PO4 - finalPO4;
    expect(cf.Ca).toBeCloseTo(baseline.Ca + totalDrop * 0.2);
  });

  it('combines all four interventions without throwing and keeps every metric within clamped bounds', () => {
    const cf = computeCounterfactual(baseline, {
      rasburicase: true,
      allopurinol: true,
      hydration: 0.75,
      dialysis: true,
    });
    expect(cf.K).toBeLessThanOrEqual(5.0);
    expect(cf.PO4).toBeLessThanOrEqual(5.0);
    expect(cf.UA).toBeLessThanOrEqual(7.0);
  });

  it('exposes exactly the 4 documented interventions with distinct ids', () => {
    expect(tlsInterventions).toHaveLength(4);
    const ids = tlsInterventions.map((i) => i.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toEqual(['rasburicase', 'allopurinol', 'hydration', 'dialysis']);
  });
});
