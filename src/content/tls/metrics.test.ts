import { describe, expect, it } from 'vitest';
import { tlsMetrics } from './metrics';

describe('tlsMetrics', () => {
  it('defines exactly the 5 TLS lab metrics with distinct ids', () => {
    expect(tlsMetrics).toHaveLength(5);
    const ids = tlsMetrics.map((m) => m.id);
    expect(new Set(ids)).toEqual(new Set(['K', 'Ca', 'PO4', 'UA', 'Cr']));
  });

  it('marks calcium as the only lowerIsWorse metric', () => {
    const directions = Object.fromEntries(tlsMetrics.map((m) => [m.id, m.thresholds.direction]));
    expect(directions.Ca).toBe('lowerIsWorse');
    expect(directions.K).toBe('higherIsWorse');
    expect(directions.PO4).toBe('higherIsWorse');
    expect(directions.UA).toBe('higherIsWorse');
    expect(directions.Cr).toBe('higherIsWorse');
  });

  it('gives every metric a unit and one decimal place, per the design spec numerical conventions', () => {
    for (const metric of tlsMetrics) {
      expect(metric.unit.length).toBeGreaterThan(0);
      expect(metric.decimalPlaces).toBe(1);
    }
  });
});
