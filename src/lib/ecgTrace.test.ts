import { describe, expect, it } from 'vitest';
import { ECG_PARAMS } from './ecg';
import { EcgTrace, MORPH_SECONDS, TRACE_PX_PER_SECOND } from './ecgTrace';

const make = (opts = {}) => new EcgTrace({ width: 240, height: 80, ...opts });
const run = (t: EcgTrace, seconds: number, irregularity = 0) => {
  for (let s = 0; s < seconds * 60; s++) t.step(1 / 60, irregularity);
};
const peaks = (cols: Float32Array, level = 0.7) => {
  let n = 0;
  for (let i = 1; i < cols.length - 1; i++) if (cols[i] > level && cols[i] >= cols[i - 1] && cols[i] > cols[i + 1]) n++;
  return n;
};

describe('EcgTrace', () => {
  it('starts as a still stretch of the normal rhythm, with beats in view', () => {
    const t = make();
    expect(t.state).toBe('normal_sinus');
    expect(peaks(t.columns)).toBeGreaterThanOrEqual(2);
  });

  it('scrolls at 80 px/s: one second shifts the trace 80 columns to the left', () => {
    const t = make();
    const before = Array.from(t.columns);
    run(t, 1);
    expect(TRACE_PX_PER_SECOND).toBe(80);
    // A feature that was at column x is at x - 80 a second later (give or take the column that is still accumulating).
    const shift = [78, 79, 80, 81, 82].find((d) => [100, 150, 200].every((x) => Math.abs(t.columns[x - d] - before[x]) < 1e-5));
    expect(shift).toBeDefined();
    expect(Math.abs(shift! - TRACE_PX_PER_SECOND)).toBeLessThanOrEqual(1);
  });

  it('keeps scrolling smoothly at any frame rate', () => {
    const a = make();
    const b = make();
    for (let i = 0; i < 120; i++) a.step(1 / 30);
    for (let i = 0; i < 240; i++) b.step(1 / 60);
    expect(Array.from(a.columns)).toEqual(Array.from(b.columns));
  });

  it('draws a beat rate that matches the state: more beats per strip at a higher rate', () => {
    const slow = new EcgTrace({ width: 480, height: 80, initialState: 'qrs_wide' });
    const fast = new EcgTrace({ width: 480, height: 80, initialState: 'peaked_t' });
    run(slow, 6);
    run(fast, 6);
    expect(peaks(fast.columns, 0.6)).toBeGreaterThanOrEqual(peaks(slow.columns, 0.6));
  });

  describe('morphing', () => {
    it('changing state starts a 1-second blend and the params reach the new state exactly', () => {
      const t = make();
      t.setState('peaked_t');
      expect(t.state).toBe('peaked_t');
      expect(t.params.tAmp).toBeCloseTo(ECG_PARAMS.normal_sinus.tAmp, 9);
      run(t, MORPH_SECONDS / 2);
      expect(t.params.tAmp).toBeGreaterThan(ECG_PARAMS.normal_sinus.tAmp);
      expect(t.params.tAmp).toBeLessThan(ECG_PARAMS.peaked_t.tAmp);
      run(t, MORPH_SECONDS);
      expect(t.params).toEqual(ECG_PARAMS.peaked_t);
    });

    it('changes shape as it scrolls: old beats on the left, new ones entering on the right', () => {
      const t = new EcgTrace({ width: 320, height: 80 });
      const tHeight = (cols: Float32Array, from: number, to: number) => {
        // The T wave is the highest point in the second half of each beat; use the global shape instead: sum of the signal.
        let s = 0;
        for (let i = from; i < to; i++) s += Math.max(0, cols[i]);
        return s;
      };
      const oldSum = tHeight(t.columns, 0, 160);
      t.setState('peaked_t');
      run(t, 2.5);
      const leftNow = tHeight(t.columns, 0, 160);
      const rightNow = tHeight(t.columns, 160, 320);
      expect(rightNow).toBeGreaterThan(0);
      expect(leftNow).not.toBeCloseTo(oldSum, 1);
    });

    it('re-targeting the same state does not restart the morph', () => {
      const t = make();
      t.setState('qrs_wide');
      run(t, 0.5);
      const mid = t.params.qrsMs;
      t.setState('qrs_wide');
      expect(t.params.qrsMs).toBe(mid);
    });

    it('interrupting a morph starts the next one from where it had got to, with no jump', () => {
      const t = make();
      t.setState('peaked_t');
      run(t, 0.5);
      const before = t.params;
      t.setState('sine_wave');
      expect(t.params).toEqual(before);
    });
  });

  describe('irregular rhythm (ventricular dysrhythmia)', () => {
    it('varies the intervals between beats; a regular rhythm does not', () => {
      const spacing = (irregularity: number) => {
        const t = new EcgTrace({ width: 800, height: 80, initialState: 'normal_sinus' });
        run(t, 12, irregularity);
        const xs: number[] = [];
        for (let i = 1; i < t.columns.length - 1; i++) if (t.columns[i] > 0.7 && t.columns[i] >= t.columns[i - 1] && t.columns[i] > t.columns[i + 1]) xs.push(i);
        const gaps = xs.slice(1).map((x, i) => x - xs[i]);
        return Math.max(...gaps) - Math.min(...gaps);
      };
      expect(spacing(0)).toBeLessThanOrEqual(2);
      expect(spacing(1)).toBeGreaterThan(spacing(0) + 6);
    });
  });

  it('fillStatic shows a still, representative stretch of a state (reduced motion)', () => {
    const t = make();
    t.fillStatic('sine_wave');
    expect(t.state).toBe('sine_wave');
    expect(Math.max(...t.columns)).toBeCloseTo(0.6, 1);
  });

  it('draws onto a 2D context: background, grid and a trace of the right length', () => {
    const calls: string[] = [];
    let lineTos = 0;
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (_t, prop: string) => {
        if (prop === 'lineTo') return () => lineTos++;
        return () => calls.push(prop);
      },
      set: () => true,
    }) as unknown as CanvasRenderingContext2D;
    make().draw(ctx, { trace: '#0f0', background: '#000', grid: '#111' });
    expect(calls).toContain('fillRect');
    expect(calls).toContain('stroke');
    expect(lineTos).toBeGreaterThanOrEqual(239);
  });

  describe('the sine-wave pattern', () => {
    const settle = (from: 'qrs_wide' | 'normal_sinus') => {
      const t = new EcgTrace({ width: 480, height: 80, initialState: from });
      t.setState('sine_wave');
      run(t, 8); // well past the one-second morph, enough for the old rhythm to scroll off
      return t.columns;
    };

    it.each(['qrs_wide', 'normal_sinus'] as const)('settles into a clean symmetric sinusoid after morphing from %s', (from) => {
      const c = settle(from);
      expect(Math.max(...c)).toBeCloseTo(0.6, 1);
      expect(Math.min(...c)).toBeCloseTo(-0.6, 1);
      expect(c.reduce((a, b) => a + b, 0) / c.length).toBeCloseTo(0, 1);
      // No sharp features anywhere: the steepest step between columns is a sine's (amplitude × 2π / columns per beat,
      // about 0.055), not a QRS's.
      let steepest = 0;
      for (let i = 1; i < c.length; i++) steepest = Math.max(steepest, Math.abs(c[i] - c[i - 1]));
      const columnsPerBeat = (60 / ECG_PARAMS.sine_wave.rateBpm) * TRACE_PX_PER_SECOND;
      expect(steepest).toBeLessThan(1.1 * 0.6 * 2 * Math.PI / columnsPerBeat);
      const normal = new EcgTrace({ width: 480, height: 80, initialState: 'normal_sinus' }).columns;
      let qrs = 0;
      for (let i = 1; i < normal.length; i++) qrs = Math.max(qrs, Math.abs(normal[i] - normal[i - 1]));
      expect(qrs).toBeGreaterThan(steepest);
      // Rising and falling halves are mirror images: equal time above and below zero, equal peak and trough height.
      const above = Array.from(c).filter((v) => v > 0).length;
      expect(Math.abs(above - c.length / 2)).toBeLessThan(c.length * 0.06);
    });

    it('is exactly periodic: the same value one beat later', () => {
      const c = settle('qrs_wide');
      const beatColumns = Math.round((60 / ECG_PARAMS.sine_wave.rateBpm) * TRACE_PX_PER_SECOND);
      for (let x = 20; x < c.length - beatColumns - 20; x += 37) expect(c[x + beatColumns]).toBeCloseTo(c[x], 1);
    });
  });
});
