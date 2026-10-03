import { describe, expect, it } from 'vitest';
import { ECG_LABELS, ECG_PARAMS, ECG_STATES, beatMs, blendParams, ecgSample, rPeakMs, type EcgState } from './ecg';

const cycle = (state: EcgState, n = 800) => Array.from({ length: n }, (_, i) => ecgSample(ECG_PARAMS[state], i / n));
const max = (xs: number[]) => Math.max(...xs);
const min = (xs: number[]) => Math.min(...xs);
/** Value of the trace at a time (ms) within the beat. */
const at = (state: EcgState, ms: number) => ecgSample(ECG_PARAMS[state], ms / beatMs(ECG_PARAMS[state]));

describe('ECG model', () => {
  it('has the five named states, each with a readout label', () => {
    expect(ECG_STATES).toEqual(['normal_sinus', 'peaked_t', 'pr_prolonged_p_flat', 'qrs_wide', 'sine_wave']);
    ECG_STATES.forEach((s) => expect(ECG_LABELS[s].length).toBeGreaterThan(3));
  });

  it('is periodic and stays within [-1, 1]', () => {
    for (const s of ECG_STATES) {
      const p = ECG_PARAMS[s];
      expect(ecgSample(p, 0.3)).toBeCloseTo(ecgSample(p, 1.3), 9);
      expect(ecgSample(p, 0.3)).toBeCloseTo(ecgSample(p, -0.7), 9);
      const c = cycle(s);
      expect(max(c)).toBeLessThanOrEqual(1.05);
      expect(min(c)).toBeGreaterThanOrEqual(-1);
    }
  });

  it('normal sinus: P ≈ 0.15, R ≈ 1.0, T ≈ 0.3, at about 75 bpm', () => {
    const p = ECG_PARAMS.normal_sinus;
    expect(p.rateBpm).toBe(75);
    expect(beatMs(p)).toBeCloseTo(800, 6);
    const tR = rPeakMs(p);
    expect(at('normal_sinus', tR)).toBeGreaterThan(0.9);
    expect(at('normal_sinus', tR)).toBeLessThanOrEqual(1.01);
    const tPeak = at('normal_sinus', tR + p.tGapMs);
    expect(tPeak).toBeGreaterThan(0.25);
    expect(tPeak).toBeLessThan(0.4);
    const pPeak = max(Array.from({ length: 200 }, (_, i) => at('normal_sinus', tR - 45 - p.prMs + 50 + (i - 100) * 0.5)));
    expect(pPeak).toBeGreaterThan(0.12);
    expect(pPeak).toBeLessThan(0.2);
  });

  it('peaked T: the T wave is about double normal and narrower', () => {
    const n = ECG_PARAMS.normal_sinus;
    const k = ECG_PARAMS.peaked_t;
    const tN = at('normal_sinus', rPeakMs(n) + n.tGapMs);
    const tK = at('peaked_t', rPeakMs(k) + k.tGapMs);
    expect(tK).toBeGreaterThan(1.8 * tN);
    expect(k.tWidthMs).toBeLessThan(n.tWidthMs);
  });

  it('PR prolongation: PR about 280 ms, P wave nearly flat, T still peaked', () => {
    const p = ECG_PARAMS.pr_prolonged_p_flat;
    expect(p.prMs).toBe(280);
    expect(p.pAmp).toBeLessThanOrEqual(0.05);
    expect(p.tAmp).toBeGreaterThan(ECG_PARAMS.normal_sinus.tAmp * 1.8);
  });

  it('wide QRS: about 160 ms, no P wave, and the T wave runs into the QRS (no ST segment between them)', () => {
    const p = ECG_PARAMS.qrs_wide;
    expect(p.qrsMs).toBe(160);
    expect(p.pAmp).toBe(0);
    expect(p.tGapMs).toBeLessThan(ECG_PARAMS.peaked_t.tGapMs);
    // The QRS ends half a QRS-width after the R peak; the T peak is within ~35 ms of that point.
    expect(p.tGapMs - p.qrsMs / 2).toBeLessThan(40);
    // And the trace never returns to baseline between the R wave and the T wave.
    const tR = rPeakMs(p);
    for (let ms = tR + p.qrsMs / 2; ms < tR + p.tGapMs; ms += 5) expect(at('qrs_wide', ms)).toBeGreaterThan(0.12);
    // The complex is visibly broader: it stays above a fifth of its height for far longer than a normal QRS does,
    // and its total width at that level is about the stated 160 ms.
    const msAbove = (state: EcgState, level: number) => {
      const params = ECG_PARAMS[state];
      const T = beatMs(params);
      let n = 0;
      for (let ms = 0; ms < T; ms++) if (ecgSample(params, ms / T) > level) n++;
      return n;
    };
    expect(msAbove('qrs_wide', 0.2)).toBeGreaterThan(1.8 * msAbove('normal_sinus', 0.2));
    // (R wave plus the T wave it runs into.)
    expect(msAbove('qrs_wide', 0.2)).toBeGreaterThan(150);
  });

  it('sine wave: a smooth oscillation of amplitude about 0.6 with no sharp QRS', () => {
    const c = cycle('sine_wave');
    expect(max(c)).toBeCloseTo(0.6, 2);
    expect(min(c)).toBeCloseTo(-0.6, 2);
    let steepest = 0;
    for (let i = 1; i < c.length; i++) steepest = Math.max(steepest, Math.abs(c[i] - c[i - 1]));
    expect(steepest).toBeLessThan(0.01);
    const normal = cycle('normal_sinus');
    let sharp = 0;
    for (let i = 1; i < normal.length; i++) sharp = Math.max(sharp, Math.abs(normal[i] - normal[i - 1]));
    expect(sharp).toBeGreaterThan(5 * steepest);
  });

  it('the heart slows through the sequence rather than speeding up, ending near 60 bpm (hyperkalaemia causes bradycardia)', () => {
    const rates = ECG_STATES.map((s) => ECG_PARAMS[s].rateBpm);
    expect(rates[3]).toBeLessThan(rates[0]);
    expect(rates[4]).toBeLessThan(rates[0]);
    expect(rates[4]).toBeGreaterThanOrEqual(55);
    expect(rates[4]).toBeLessThanOrEqual(65);
    // Severe stages are slower than the earlier ones.
    expect(rates[3]).toBeLessThan(rates[1]);
  });

  it('the five waveforms are clearly distinct from each other', () => {
    const cycles = ECG_STATES.map((s) => cycle(s, 400));
    for (let a = 0; a < cycles.length; a++) {
      for (let b = a + 1; b < cycles.length; b++) {
        let diff = 0;
        for (let i = 0; i < 400; i++) diff += Math.abs(cycles[a][i] - cycles[b][i]);
        expect(diff / 400, `${ECG_STATES[a]} vs ${ECG_STATES[b]}`).toBeGreaterThan(0.02);
      }
    }
  });

  describe('blendParams', () => {
    it('returns the ends exactly and interpolates every field in between', () => {
      const a = ECG_PARAMS.normal_sinus;
      const b = ECG_PARAMS.qrs_wide;
      expect(blendParams(a, b, 0)).toEqual(a);
      expect(blendParams(a, b, 1)).toEqual(b);
      const m = blendParams(a, b, 0.5);
      expect(m.qrsMs).toBeCloseTo((a.qrsMs + b.qrsMs) / 2, 9);
      expect(m.rateBpm).toBeCloseTo((a.rateBpm + b.rateBpm) / 2, 9);
    });
    it('clamps its blend factor', () => {
      const a = ECG_PARAMS.normal_sinus;
      const b = ECG_PARAMS.peaked_t;
      expect(blendParams(a, b, -3)).toEqual(a);
      expect(blendParams(a, b, 9)).toEqual(b);
    });
    it('changes the waveform gradually: no sample jumps between neighbouring blend steps', () => {
      for (let i = 0; i < ECG_STATES.length - 1; i++) {
        const a = ECG_PARAMS[ECG_STATES[i]];
        const b = ECG_PARAMS[ECG_STATES[i + 1]];
        for (let k = 0; k < 1; k += 0.1) {
          const p0 = blendParams(a, b, k);
          const p1 = blendParams(a, b, k + 0.1);
          let worst = 0;
          for (let s = 0; s < 400; s++) worst = Math.max(worst, Math.abs(ecgSample(p0, s / 400) - ecgSample(p1, s / 400)));
          expect(worst).toBeLessThan(0.45);
        }
      }
    });
  });
});
