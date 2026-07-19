import { describe, expect, it } from 'vitest';
import { getFlag } from './getFlag';
import type { DiseaseMetric } from './metric';

const potassium: DiseaseMetric = {
  id: 'K',
  label: 'K⁺',
  unit: 'mmol/L',
  decimalPlaces: 1,
  thresholds: {
    direction: 'higherIsWorse',
    normal: [3.5, 5.0],
    amber: [5.0, 6.0],
    redBoundary: 6.0,
  },
};

const calcium: DiseaseMetric = {
  id: 'Ca',
  label: 'Ca²⁺',
  unit: 'mg/dL',
  decimalPlaces: 1,
  thresholds: {
    direction: 'lowerIsWorse',
    normal: [8.5, 10.5],
    amber: [7.0, 8.5],
    redBoundary: 7.0,
  },
};

describe('getFlag', () => {
  it('flags a higherIsWorse metric normal within the inclusive band', () => {
    expect(getFlag(potassium, 3.5)).toBe('normal');
    expect(getFlag(potassium, 4.2)).toBe('normal');
    expect(getFlag(potassium, 5.0)).toBe('normal'); // inclusive upper bound
  });

  it('flags a higherIsWorse metric amber between normal and the red boundary', () => {
    expect(getFlag(potassium, 5.01)).toBe('amber');
    expect(getFlag(potassium, 5.9)).toBe('amber');
  });

  it('flags a higherIsWorse metric red at and beyond the red boundary', () => {
    expect(getFlag(potassium, 6.0)).toBe('red'); // inclusive
    expect(getFlag(potassium, 9.5)).toBe('red');
  });

  it('flags a higherIsWorse metric amber below normal (e.g. below range but not red)', () => {
    expect(getFlag(potassium, 3.0)).toBe('amber');
  });

  it('flips the comparison direction for a lowerIsWorse metric, not just the label', () => {
    expect(getFlag(calcium, 9.4)).toBe('normal');
    expect(getFlag(calcium, 8.5)).toBe('normal'); // inclusive lower bound
    expect(getFlag(calcium, 7.8)).toBe('amber');
    expect(getFlag(calcium, 7.0)).toBe('red'); // inclusive
    expect(getFlag(calcium, 6.2)).toBe('red');
    expect(getFlag(calcium, 11.0)).toBe('amber'); // above normal, but not dangerous for this metric
  });
});
