import { describe, expect, it } from 'vitest';
import { tlsInterventions } from '../content/tls/interventions';
import {
  CASCADE_PEAK_PROGRESS,
  DEMO_HYDRATION,
  FREE_PLAY_STEP,
  REDUCED_MOTION_PROGRESS,
  badgesShown,
  cascadeProgressFor,
  cascadeTime,
  effectsFor,
  hoursLabel,
  interventionsForStep,
  labsAt,
  scene5Step,
} from './scene5';

const peak = { K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 };
const start = { K: 4.2, Ca: 9.4, PO4: 3.5, UA: 5.0, Cr: 0.9 };

describe('scene5Step / cascadeTime', () => {
  it('is the first step before Scene 5, then one step per sixth', () => {
    expect(scene5Step(4.2)).toBe(0);
    expect(scene5Step(5)).toBe(0);
    expect(scene5Step(5.2)).toBe(1);
    expect(scene5Step(5.99)).toBe(5);
  });
  it('the cascade is idle through the rewind and the first step, then runs, then holds at the peak', () => {
    expect(cascadeTime(4.9)).toBe(0);
    expect(cascadeTime(5.1)).toBe(0);
    expect(cascadeTime(5 + 1 / 6 + 0.05)).toBeGreaterThan(0);
    expect(cascadeTime(5 + 1 / 6 + 0.05)).toBeLessThan(1);
    expect(cascadeTime(5.31)).toBe(1);
    expect(cascadeTime(6)).toBe(1);
  });
  it('maps cascade time onto Scene 2\'s progress, stopping short of the end where every crystal is absorbed', () => {
    expect(cascadeProgressFor(0)).toBe(0);
    expect(cascadeProgressFor(1)).toBe(CASCADE_PEAK_PROGRESS);
    expect(CASCADE_PEAK_PROGRESS).toBeLessThan(1);
    expect(cascadeProgressFor(5)).toBe(CASCADE_PEAK_PROGRESS);
  });
  it('reduced motion shows the baseline first and a finished cascade after', () => {
    expect(REDUCED_MOTION_PROGRESS).toHaveLength(6);
    expect(cascadeTime(5 + REDUCED_MOTION_PROGRESS[0])).toBe(0);
    for (const p of REDUCED_MOTION_PROGRESS.slice(1)) expect(cascadeTime(5 + p)).toBe(1);
    REDUCED_MOTION_PROGRESS.forEach((p, i) => expect(scene5Step(5 + p)).toBe(i));
  });
});

describe('interventionsForStep', () => {
  it('puts one intervention on per step, none in the rewind, and hands over to the viewer in free play', () => {
    expect(interventionsForStep(0, { dialysis: true })).toEqual({});
    expect(interventionsForStep(1, {})).toEqual({ rasburicase: true });
    expect(interventionsForStep(2, {})).toEqual({ allopurinol: true });
    expect(interventionsForStep(3, {})).toEqual({ hydration: DEMO_HYDRATION });
    expect(interventionsForStep(4, {})).toEqual({ dialysis: true });
    const own = { allopurinol: true, hydration: 0.2 };
    expect(interventionsForStep(FREE_PLAY_STEP, own)).toBe(own);
  });
  it('shows each badge from its step on', () => {
    expect(Object.values(badgesShown(0))).toEqual([false, false, false, false]);
    expect(badgesShown(2)).toEqual({ rasburicase: true, allopurinol: true, hydration: false, dialysis: false });
    expect(Object.values(badgesShown(5))).toEqual([true, true, true, true]);
  });
});

describe('labsAt', () => {
  it('runs from the T+0 labs to the counterfactual peak', () => {
    expect(labsAt(0, start, peak, {}, tlsInterventions)).toEqual(start);
    expect(labsAt(1, start, peak, {}, tlsInterventions)).toEqual(peak);
    const half = labsAt(0.5, start, peak, {}, tlsInterventions);
    expect(half.K).toBeCloseTo(5.25, 9);
  });
  it('follows the intervention effect functions', () => {
    const treated = labsAt(1, start, peak, { rasburicase: true }, tlsInterventions);
    expect(treated.UA).toBeCloseTo(11.4 * 0.3, 9);
    expect(treated.K).toBe(6.3);
  });
  it('clamps time to 0–1', () => {
    expect(labsAt(7, start, peak, {}, tlsInterventions)).toEqual(peak);
    expect(labsAt(-3, start, peak, {}, tlsInterventions)).toEqual(start);
  });
});

describe('hoursLabel', () => {
  it('spans T+0h to T+48h', () => {
    expect(hoursLabel(0)).toBe('T+0h');
    expect(hoursLabel(0.5)).toBe('T+24h');
    expect(hoursLabel(1)).toBe('T+48h');
    expect(hoursLabel(3)).toBe('T+48h');
  });
});

describe('effectsFor', () => {
  it('leaves everything as it is when nothing is on', () => {
    expect(effectsFor(peak, {}, tlsInterventions)).toEqual({ caphosShare: 1, uricShare: 1, purineLoss: 0, purineAction: null, flowSpeed: 1, dialysis: 0 });
  });
  it('rasburicase dissolves uric acid (70% of it) and leaves phosphate alone', () => {
    const e = effectsFor(peak, { rasburicase: true }, tlsInterventions);
    expect(e.purineAction).toBe('dissolve');
    expect(e.purineLoss).toBeCloseTo(0.7, 9);
    expect(e.uricShare).toBeCloseTo(0.3, 9);
    expect(e.caphosShare).toBe(1);
  });
  it('allopurinol blocks the enzyme step (half of the uric acid); rasburicase wins when both are on', () => {
    const a = effectsFor(peak, { allopurinol: true }, tlsInterventions);
    expect(a.purineAction).toBe('block');
    expect(a.uricShare).toBeCloseTo(0.5, 9);
    expect(effectsFor(peak, { allopurinol: true, rasburicase: true }, tlsInterventions).purineAction).toBe('dissolve');
  });
  it('hydration speeds the flow and thins both crystal kinds', () => {
    const e = effectsFor(peak, { hydration: 1 }, tlsInterventions);
    expect(e.flowSpeed).toBeCloseTo(1.5, 9);
    expect(e.caphosShare).toBeCloseTo(0.6, 9);
    expect(e.uricShare).toBeCloseTo(0.6, 9);
    expect(e.purineAction).toBeNull();
  });
  it('dialysis runs the circuit and caps phosphate and uric acid', () => {
    const e = effectsFor(peak, { dialysis: true }, tlsInterventions);
    expect(e.dialysis).toBe(1);
    expect(e.caphosShare).toBeCloseTo(5 / 7.8, 9);
    expect(e.uricShare).toBeCloseTo(7 / 11.4, 9);
  });
});
