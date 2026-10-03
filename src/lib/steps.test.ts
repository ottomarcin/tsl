import { describe, expect, it } from 'vitest';
import { labValuesAt, latestTimestamp, stepIndexFromProgress } from './steps';

describe('stepIndexFromProgress', () => {
  it('splits progress into equal bands', () => {
    expect(stepIndexFromProgress(0, 3)).toBe(0);
    expect(stepIndexFromProgress(0.33, 3)).toBe(0);
    expect(stepIndexFromProgress(0.34, 3)).toBe(1);
    expect(stepIndexFromProgress(0.67, 3)).toBe(2);
  });
  it('clamps out-of-range progress and keeps 1.0 on the last step', () => {
    expect(stepIndexFromProgress(1, 3)).toBe(2);
    expect(stepIndexFromProgress(5, 3)).toBe(2);
    expect(stepIndexFromProgress(-1, 3)).toBe(0);
  });
  it('returns 0 for single-step or empty scenes', () => {
    expect(stepIndexFromProgress(0.9, 1)).toBe(0);
    expect(stepIndexFromProgress(0.9, 0)).toBe(0);
  });
});

describe('latestTimestamp', () => {
  const steps = [
    { id: 'a', order: 1, caption: '', timestamp: 'T+0h' },
    { id: 'b', order: 2, caption: '' },
    { id: 'c', order: 3, caption: '', timestamp: 'T+6h' },
  ];
  it('inherits the previous step timestamp', () => {
    expect(latestTimestamp(steps, 1)).toBe('T+0h');
    expect(latestTimestamp(steps, 2)).toBe('T+6h');
  });
  it('returns undefined when none exist', () => {
    expect(latestTimestamp([{ id: 'x', order: 1, caption: '' }], 0)).toBeUndefined();
  });
});

describe('labValuesAt', () => {
  const scenes = [
    { id: 's0', index: 0, title: '', steps: [
      { id: 'a', order: 1, caption: '', labValues: [{ metricId: 'K', value: 4.2 }, { metricId: 'Ca', value: 9.4 }] },
      { id: 'b', order: 2, caption: '' },
    ] },
    { id: 's1', index: 1, title: '', steps: [
      { id: 'c', order: 1, caption: '', labValues: [{ metricId: 'K', value: 4.6 }] },
      { id: 'd', order: 2, caption: '', labValues: [{ metricId: 'K', value: 5.5 }, { metricId: 'PO4', value: 5.5 }] },
      { id: 'e', order: 3, caption: '' },
    ] },
  ];
  it('applies targets cumulatively through the current step', () => {
    expect(labValuesAt(scenes, 1, 0)).toEqual({ K: 4.6, Ca: 9.4 });
    expect(labValuesAt(scenes, 1, 1)).toEqual({ K: 5.5, Ca: 9.4, PO4: 5.5 });
  });
  it('keeps earlier values on steps that set none (skipping straight to the last step)', () => {
    expect(labValuesAt(scenes, 1, 2)).toEqual({ K: 5.5, Ca: 9.4, PO4: 5.5 });
  });
  it('includes all steps of earlier scenes and nothing from later ones', () => {
    expect(labValuesAt(scenes, 0, 1)).toEqual({ K: 4.2, Ca: 9.4 });
  });
  it('tolerates out-of-range indices', () => {
    expect(labValuesAt(scenes, 9, 9)).toEqual({ K: 5.5, Ca: 9.4, PO4: 5.5 });
  });
});
