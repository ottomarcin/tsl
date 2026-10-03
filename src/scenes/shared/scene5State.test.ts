import { afterEach, describe, expect, it } from 'vitest';
import { CASCADE_PEAK_PROGRESS } from '../../lib/scene5';
import { useAppStore } from '../../store/useAppStore';
import { BASELINE_LABS, PEAK_LABS, activeInterventions, cascadeProgressAt, effectsAt } from './scene5State';

afterEach(() => useAppStore.setState({ scrub: null, interventionState: {} }));

describe('scene5State', () => {
  it('the peak is the end of Scene 4 and the baseline the start of Scene 5', () => {
    expect(PEAK_LABS).toMatchObject({ K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 });
    expect(BASELINE_LABS).toMatchObject({ K: 4.2, Ca: 9.4, PO4: 3.5, UA: 5.0, Cr: 0.9 });
  });
  it('the cascade follows its own progress through Scene 2, then is idle on the rewind, then runs to the peak', () => {
    expect(cascadeProgressAt(2.5)).toBe(0.5);
    expect(cascadeProgressAt(3.5)).toBe(1);
    expect(cascadeProgressAt(4.5)).toBe(0);
    expect(cascadeProgressAt(5.05)).toBe(0);
    expect(cascadeProgressAt(5.6)).toBeCloseTo(CASCADE_PEAK_PROGRESS, 9);
  });
  it('a scrubbed time overrides the story in Scene 5 only', () => {
    useAppStore.setState({ scrub: 0.5 });
    expect(cascadeProgressAt(5.6)).toBeCloseTo(CASCADE_PEAK_PROGRESS * 0.5, 9);
    expect(cascadeProgressAt(4.5)).toBe(0);
    expect(cascadeProgressAt(3.2)).toBe(1);
  });
  it('the interventions follow the step, and the viewer\'s own in free play', () => {
    expect(activeInterventions(4.9)).toEqual({});
    expect(activeInterventions(5.25)).toEqual({ rasburicase: true });
    useAppStore.setState({ interventionState: { dialysis: true } });
    expect(activeInterventions(5.25)).toEqual({ rasburicase: true });
    expect(activeInterventions(5.9)).toEqual({ dialysis: true });
    expect(effectsAt(5.9).dialysis).toBe(1);
    expect(effectsAt(5.05).dialysis).toBe(0);
  });
});
