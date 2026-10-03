import { describe, expect, it } from 'vitest';
import {
  CALCIUM,
  CONVERGENCE_POS,
  CONVERGENCE_START,
  CRYSTALS,
  FLOW,
  HEART_POS,
  KIDNEY_INLET,
  MERGE_T,
  REDUCED_MOTION_PROGRESS,
  STREAM_IDS,
  TUBE_POINTS,
  buildCalcium,
  buildCrystals,
  buildPathLut,
  calciumRemaining,
  calciumState,
  convergence,
  crystalJourney,
  flowT,
  getTubeLuts,
  heartArrival,
  journeyPoint,
  kidneyLoad,
  lutPoint,
  streamEmphasis,
  streamReveal,
} from './cascade';

describe('tubes', () => {
  const luts = getTubeLuts();
  it('start near the source cloud', () => {
    for (const id of STREAM_IDS) expect(TUBE_POINTS[id][0][1]).toBeGreaterThan(3.5);
  });
  it('K ends at the heart; PO₄ and purines end together at the convergence point', () => {
    const end = TUBE_POINTS.K.at(-1)!;
    expect(Math.hypot(end[0] - HEART_POS[0], end[1] - HEART_POS[1])).toBeLessThan(1.3);
    expect(TUBE_POINTS.PO4.at(-1)).toEqual(CONVERGENCE_POS);
    expect(TUBE_POINTS.purines.at(-1)).toEqual(CONVERGENCE_POS);
  });
  it('are ordered short < medium < long, as in the spec', () => {
    expect(luts.K.length).toBeLessThan(luts.PO4.length);
    expect(luts.PO4.length).toBeLessThan(luts.purines.length);
    expect(luts.K.length).toBeGreaterThan(4);
    expect(luts.purines.length).toBeGreaterThan(10);
  });
  it('have particle counts and traversal times from the spec', () => {
    expect(FLOW.K).toEqual({ count: 60, traversal: 6 });
    expect(FLOW.PO4).toEqual({ count: 80, traversal: 8 });
    expect(FLOW.purines).toEqual({ count: 120, traversal: 12 });
  });
  it('lookup tables interpolate end to end, clamp, and are evenly spaced by arc length', () => {
    const lut = buildPathLut([[0, 0, 0], [3, 0, 0], [3, 4, 0]]);
    expect(lutPoint(lut, 0)[0]).toBeCloseTo(0, 5);
    expect(lutPoint(lut, 1)[1]).toBeCloseTo(4, 5);
    expect(lutPoint(lut, -3)).toEqual(lutPoint(lut, 0));
    expect(lutPoint(lut, 9)).toEqual(lutPoint(lut, 1));
    const a = lutPoint(lut, 0.3);
    const b = lutPoint(lut, 0.31);
    const c = lutPoint(lut, 0.6);
    const d = lutPoint(lut, 0.61);
    expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(Math.hypot(d[0] - c[0], d[1] - c[1]), 1);
  });
});

describe('timeline', () => {
  it('reveals K first, then PO₄, then purines, each completing inside or soon after its band', () => {
    expect(streamReveal('K', 0)).toBe(0);
    expect(streamReveal('K', 0.2)).toBe(1);
    expect(streamReveal('PO4', 0.2)).toBe(0);
    expect(streamReveal('PO4', 0.45)).toBe(1);
    expect(streamReveal('purines', 0.45)).toBe(0);
    expect(streamReveal('purines', 0.7)).toBe(1);
  });
  it('is monotonic in progress', () => {
    for (const id of STREAM_IDS) {
      let prev = 0;
      for (let p = 0; p <= 1; p += 0.02) {
        const r = streamReveal(id, p);
        expect(r).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = r;
      }
    }
  });
  it('highlights the stream being explained and dims the others, then brightens all', () => {
    expect(streamEmphasis('K', 0.1)).toBe(1);
    expect(streamEmphasis('PO4', 0.1)).toBeLessThan(1);
    expect(streamEmphasis('PO4', 0.4)).toBe(1);
    expect(streamEmphasis('purines', 0.6)).toBe(1);
    expect(streamEmphasis('K', 0.99)).toBe(1);
  });
  it('convergence stays 0 until step 2.4 and reaches 1 by the end', () => {
    expect(convergence(CONVERGENCE_START - 0.01)).toBe(0);
    expect(convergence(1)).toBe(1);
  });
  it('the heart reacts only after the K⁺ front arrives', () => {
    expect(heartArrival(0.02)).toBe(0);
    expect(heartArrival(0.24)).toBe(1);
  });
  it('the kidney fills late', () => {
    expect(kidneyLoad(0.5)).toBe(0);
    expect(kidneyLoad(1)).toBe(1);
  });
});

describe('calcium pool', () => {
  const ca = buildCalcium();
  it('starts with 60 particles inside the pool sphere', () => {
    expect(ca).toHaveLength(60);
    for (const p of ca) expect(Math.hypot(p.home[0] - -0.1, p.home[1] - 0.3, p.home[2])).toBeLessThanOrEqual(0.7 + 1e-9);
  });
  it('is deterministic', () => {
    expect(buildCalcium()).toEqual(ca);
    expect(buildCalcium(8)[0].home).not.toEqual(ca[0].home);
  });
  it('depletes from 60 to ~10 over step 2.2 and does not change before or after it', () => {
    expect(calciumRemaining(ca, 0.1)).toBe(60);
    expect(calciumRemaining(ca, 0.27)).toBe(60);
    const mid = calciumRemaining(ca, 0.38);
    expect(mid).toBeGreaterThan(10);
    expect(mid).toBeLessThan(60);
    expect(calciumRemaining(ca, 0.6)).toBe(60 - CALCIUM.consumed);
    expect(calciumRemaining(ca, 1)).toBe(10);
  });
  it('depletion only ever goes down as progress rises, and replays in reverse', () => {
    let prev = 60;
    for (let p = 0; p <= 1; p += 0.01) {
      const n = calciumRemaining(ca, p);
      expect(n).toBeLessThanOrEqual(prev);
      prev = n;
    }
    expect(calciumRemaining(ca, 0.1)).toBe(60);
  });
  it('a consumed particle sits in the pool, travels, then fuses', () => {
    const p = ca.find((c) => c.leaveAt !== null)!;
    expect(calciumState(p, p.leaveAt! - 0.01)).toEqual({ travel: 0, visible: true });
    const during = calciumState(p, p.leaveAt! + CALCIUM.travel / 2);
    expect(during.travel).toBeCloseTo(0.5, 5);
    expect(during.visible).toBe(true);
    expect(calciumState(p, p.leaveAt! + CALCIUM.travel + 0.01).visible).toBe(false);
  });
  it('the survivors never leave', () => {
    const stays = ca.filter((c) => c.leaveAt === null);
    expect(stays).toHaveLength(10);
    for (const c of stays) expect(calciumState(c, 1).visible).toBe(true);
  });
});

describe('crystals', () => {
  const caphos = buildCrystals('caphos');
  const uric = buildCrystals('uricacid');
  const luts = getTubeLuts();
  it('there are 15–20 calcium-phosphate and 10–15 uric acid crystals (spec)', () => {
    expect(caphos.length).toBeGreaterThanOrEqual(15);
    expect(caphos.length).toBeLessThanOrEqual(20);
    expect(uric.length).toBeGreaterThanOrEqual(10);
    expect(uric.length).toBeLessThanOrEqual(15);
  });
  it('calcium-phosphate crystals form during step 2.2, uric acid during step 2.3', () => {
    for (const c of caphos) {
      expect(c.spawnAt).toBeGreaterThanOrEqual(0.25);
      expect(c.spawnAt).toBeLessThan(0.5);
    }
    for (const c of uric) {
      expect(c.spawnAt).toBeGreaterThanOrEqual(0.5);
      expect(c.spawnAt).toBeLessThan(0.75);
    }
  });
  it('do not exist before they form', () => {
    expect(crystalJourney(caphos[0], caphos[0].spawnAt - 0.01)).toBeNull();
    expect(crystalJourney(caphos[0], caphos[0].spawnAt)).toBe(0);
  });
  it('drift down their tube until step 2.4 (spread out, not yet at the kidney), then every crystal reaches it by the end', () => {
    const early = crystalJourney(caphos[0], CONVERGENCE_START)!;
    expect(early).toBeGreaterThan(0.2);
    expect(early).toBeLessThan(0.7);
    const late = crystalJourney(caphos.at(-1)!, CONVERGENCE_START)!;
    expect(early - late).toBeGreaterThan(0.1);
    for (const c of [...caphos, ...uric]) expect(crystalJourney(c, 1)).toBeCloseTo(1, 9);
  });
  it('journeys are monotonic in progress (and so reverse cleanly)', () => {
    for (const c of [caphos[3], uric[2]]) {
      let prev = 0;
      for (let p = c.spawnAt; p <= 1; p += 0.01) {
        const u = crystalJourney(c, p)!;
        expect(u).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = u;
      }
    }
  });
  it('journey points start on the tube at the formation point and end at the kidney inlet', () => {
    const start = journeyPoint(luts.PO4, MERGE_T, 0);
    const onTube = lutPoint(luts.PO4, MERGE_T);
    expect(start).toEqual(onTube);
    const end = journeyPoint(luts.PO4, MERGE_T, 1);
    expect(end[0]).toBeCloseTo(KIDNEY_INLET[0], 5);
    expect(end[1]).toBeCloseTo(KIDNEY_INLET[1], 5);
    const uEnd = journeyPoint(luts.purines, CRYSTALS.uricacid.t, 1);
    expect(uEnd[1]).toBeCloseTo(KIDNEY_INLET[1], 5);
  });
  it('both crystal streams pass through the shared convergence point on the way in', () => {
    const near = (lut: typeof luts.PO4, t: number) => {
      let best = 1e9;
      for (let u = 0; u <= 1; u += 0.005) {
        const p = journeyPoint(lut, t, u);
        best = Math.min(best, Math.hypot(p[0] - CONVERGENCE_POS[0], p[1] - CONVERGENCE_POS[1]));
      }
      return best;
    };
    expect(near(luts.PO4, MERGE_T)).toBeLessThan(0.1);
    expect(near(luts.purines, 0.88)).toBeLessThan(0.1);
  });
});

describe('reduced-motion snapshots', () => {
  it('show every step with its stream complete, and the crystals still visible in the last', () => {
    expect(streamReveal('K', REDUCED_MOTION_PROGRESS[0])).toBe(1);
    expect(streamReveal('PO4', REDUCED_MOTION_PROGRESS[1])).toBe(1);
    expect(streamReveal('purines', REDUCED_MOTION_PROGRESS[2])).toBe(1);
    const last = REDUCED_MOTION_PROGRESS[3];
    const visible = buildCrystals('caphos').filter((c) => {
      const u = crystalJourney(c, last);
      return u !== null && u < 0.97;
    });
    expect(visible.length).toBeGreaterThan(5);
  });
});

describe('flow', () => {
  it('spreads particles evenly, wraps, and advances at 1/traversal per second', () => {
    expect(flowT(0, 4, 0, 8)).toBe(0);
    expect(flowT(1, 4, 0, 8)).toBe(0.25);
    expect(flowT(0, 4, 8, 8)).toBeCloseTo(0, 9);
    expect(flowT(0, 4, 2, 8)).toBeCloseTo(0.25, 9);
    expect(flowT(3, 4, 4, 8)).toBeCloseTo(0.25, 9);
  });
});
