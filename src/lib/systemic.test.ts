import { describe, expect, it } from 'vitest';
import {
  MAX_PULSES,
  POSES,
  PULSE_PERIOD,
  PULSE_TRAVEL,
  REDUCED_MOTION_PROGRESS,
  criticalLevel,
  dominantPose,
  dysrhythmiaAt,
  ecgStateAt,
  erraticLevel,
  nervePulses,
  panelFocus,
  poseWeights,
  threadReach,
} from './systemic';
import { stepIndexFromProgress } from './steps';

describe('cardiac timeline', () => {
  it('stays normal through step 4.1, then moves through the states during 4.2 in order', () => {
    const seq = [0, 0.1, 0.26, 0.3, 0.38, 0.45, 0.6, 0.74, 0.8, 1].map(ecgStateAt);
    expect(seq).toEqual(['normal_sinus', 'normal_sinus', 'normal_sinus', 'peaked_t', 'pr_prolonged_p_flat', 'qrs_wide', 'qrs_wide', 'qrs_wide', 'sine_wave', 'sine_wave']);
  });
  it('all three pre-sine states are reached inside step 4.2 (progress 0.25–0.5)', () => {
    expect(ecgStateAt(0.3)).toBe('peaked_t');
    expect(ecgStateAt(0.4)).toBe('pr_prolonged_p_flat');
    expect(ecgStateAt(0.49)).toBe('qrs_wide');
  });
  it('the sine wave arrives with step 4.4, and only then does the heart stutter', () => {
    expect(ecgStateAt(0.74)).not.toBe('sine_wave');
    expect(ecgStateAt(0.75)).toBe('sine_wave');
    expect(dysrhythmiaAt(0.7)).toBe(0);
    expect(dysrhythmiaAt(0.9)).toBe(1);
  });
});

describe('hand poses', () => {
  it('weights always sum to 1', () => {
    for (let p = 0; p <= 1; p += 0.02) {
      const w = poseWeights(p);
      expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      Object.values(w).forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    }
  });
  it('holds the neutral pose through steps 4.1 and 4.2', () => {
    expect(poseWeights(0).neutral_relaxed).toBe(1);
    expect(poseWeights(0.45).neutral_relaxed).toBe(1);
    expect(dominantPose(0.3)).toBe('neutral_relaxed');
  });
  it('passes through paresthesia and tetany in turn during 4.3 and ends in full carpopedal spasm', () => {
    const order = [0.5, 0.56, 0.62, 0.68, 0.74].map(dominantPose);
    expect(order[0]).toBe('neutral_relaxed');
    expect(order).toContain('paresthesia_subtle');
    expect(order).toContain('tetany_mild');
    expect(order.at(-1)).toBe('trousseau_carpopedal');
    // Poses never run backwards as progress rises.
    const idx = order.map((o) => POSES.indexOf(o));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(poseWeights(0.74).trousseau_carpopedal).toBe(1);
    expect(poseWeights(1).trousseau_carpopedal).toBe(1);
  });
  it('only two neighbouring poses are blended at any moment', () => {
    for (let p = 0.5; p <= 0.74; p += 0.01) expect(Object.values(poseWeights(p)).filter((v) => v > 1e-9).length).toBeLessThanOrEqual(2);
  });
  it('nerves go erratic as the poses get worse', () => {
    expect(erraticLevel(0.4)).toBe(0);
    expect(erraticLevel(0.6)).toBeGreaterThan(0);
    expect(erraticLevel(0.8)).toBe(1);
  });
});

describe('nerve pulses', () => {
  const sweep = (erratic: number, seconds = 60) => {
    const starts: number[] = [];
    let prev: number[] = [];
    for (let t = 0; t < seconds; t += 0.02) {
      const now = nervePulses(t, erratic);
      // A new pulse appears when the count rises or the head position resets.
      if (now.length > prev.length) starts.push(t);
      prev = now;
    }
    return starts;
  };

  it('regular: one pulse every 1.5 s, each crossing the arm in 0.5 s', () => {
    expect(PULSE_PERIOD).toBe(1.5);
    expect(PULSE_TRAVEL).toBe(0.5);
    const starts = sweep(0, 30);
    starts.slice(1).forEach((s, i) => expect(s - starts[i]).toBeCloseTo(1.5, 1));
    expect(nervePulses(0.25, 0)).toEqual([expect.closeTo(0.5, 6)]);
    expect(nervePulses(1.0, 0)).toEqual([]);
  });
  it('positions are within the arm, at most four at once, and never negative', () => {
    for (const e of [0, 0.5, 1]) {
      for (let t = 0; t < 40; t += 0.05) {
        const ps = nervePulses(t, e);
        expect(ps.length).toBeLessThanOrEqual(MAX_PULSES);
        ps.forEach((p) => {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        });
      }
    }
  });
  it('erratic: the intervals vary, some pulses double up or are skipped', () => {
    const starts = sweep(1, 120);
    const gaps = starts.slice(1).map((s, i) => s - starts[i]);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(0.6);
    expect(gaps.some((g) => g < 0.7)).toBe(true); // a double pulse
    expect(gaps.some((g) => g > 2.0)).toBe(true); // a skipped one
  });
  it('is deterministic in time', () => {
    expect(nervePulses(12.34, 0.8)).toEqual(nervePulses(12.34, 0.8));
  });
});

describe('panel focus, threads and critical state', () => {
  it('both panels are fully present in 4.1 and 4.4; the one being discussed is forward in between', () => {
    expect(panelFocus(0.1)).toEqual({ heart: 1, hand: 1 });
    expect(panelFocus(0.9)).toEqual({ heart: 1, hand: 1 });
    expect(panelFocus(0.38).heart).toBe(1);
    expect(panelFocus(0.38).hand).toBeLessThan(1);
    expect(panelFocus(0.62).hand).toBe(1);
    expect(panelFocus(0.62).heart).toBeLessThan(1);
  });
  it('neither panel ever disappears', () => {
    for (let p = 0; p <= 1; p += 0.02) {
      expect(panelFocus(p).heart).toBeGreaterThanOrEqual(0.5);
      expect(panelFocus(p).hand).toBeGreaterThanOrEqual(0.5);
    }
  });
  it('threads extend in step 4.1 and turn red only when both panels are critical', () => {
    expect(threadReach(0)).toBe(0);
    expect(threadReach(0.2)).toBe(1);
    expect(criticalLevel(0.5)).toBe(0);
    expect(criticalLevel(0.9)).toBe(1);
  });
});

describe('reduced-motion snapshots', () => {
  it('show one still picture per step, each inside its own step', () => {
    REDUCED_MOTION_PROGRESS.forEach((p, i) => expect(stepIndexFromProgress(p, 4)).toBe(i));
    expect(ecgStateAt(REDUCED_MOTION_PROGRESS[1])).not.toBe('normal_sinus');
    expect(dominantPose(REDUCED_MOTION_PROGRESS[2])).not.toBe('neutral_relaxed');
    expect(ecgStateAt(REDUCED_MOTION_PROGRESS[3])).toBe('sine_wave');
    expect(dominantPose(REDUCED_MOTION_PROGRESS[3])).toBe('trousseau_carpopedal');
  });
});
