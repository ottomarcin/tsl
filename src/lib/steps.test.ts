import { describe, expect, it } from 'vitest';
import { latestTimestamp, stepIndexFromProgress } from './steps';

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
