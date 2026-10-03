import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_COUNT,
  FILTRATE,
  LODGE_SHARE,
  MAX_LODGES,
  TUBE,
  buildInflow,
  effectiveMechanism,
  feedbackStrength,
  filtrateSpeed,
  inflowPoint,
  inflowState,
  lodgedPoints,
  lumenRadiusAt,
  obstructionLevel,
  overlayStrength,
} from './renal';

describe('lumen', () => {
  it('tapers from the inflow to the outflow end', () => {
    expect(lumenRadiusAt(2)).toBeCloseTo(TUBE.lumenIn, 9);
    expect(lumenRadiusAt(-2)).toBeCloseTo(TUBE.lumenOut, 9);
    expect(lumenRadiusAt(0)).toBeLessThan(lumenRadiusAt(1));
  });
  it('clamps outside the tube', () => {
    expect(lumenRadiusAt(9)).toBeCloseTo(TUBE.lumenIn, 9);
    expect(lumenRadiusAt(-9)).toBeCloseTo(TUBE.lumenOut, 9);
  });
});

describe('inflow crystals', () => {
  const crystals = buildInflow();
  it('are deterministic and about 22, alternating the two kinds', () => {
    expect(buildInflow()).toEqual(crystals);
    expect(crystals).toHaveLength(CRYSTAL_COUNT);
    expect(crystals.filter((c) => c.kind === 'caphos').length).toBe(11);
  });
  it('enter one after another during the scene, at most one per ~4%', () => {
    for (let i = 1; i < crystals.length; i++) expect(crystals[i].enterAt - crystals[i - 1].enterAt).toBeGreaterThan(0.03);
    expect(crystals[0].enterAt).toBeGreaterThan(0);
    expect(crystals.at(-1)!.enterAt).toBeLessThan(0.95);
  });
  it('about 60% lodge, and none lodge before step 3.2', () => {
    const lodgers = crystals.filter((c) => c.willLodge);
    expect(lodgers.length / crystals.length).toBeGreaterThan(LODGE_SHARE - 0.2);
    expect(lodgers.length / crystals.length).toBeLessThan(LODGE_SHARE + 0.15);
    expect(crystals.some((c) => inflowState(c, 0.24).lodged)).toBe(false);
    expect(crystals.some((c) => inflowState(c, 0.3).lodged)).toBe(true);
  });
  it('do not exist before they enter, and enter at the inflow end (+Z)', () => {
    const c = crystals[0];
    expect(inflowState(c, c.enterAt - 0.01).visible).toBe(false);
    const st = inflowState(c, c.enterAt + 1e-6);
    expect(st.visible).toBe(true);
    expect(inflowPoint(c, st)[2]).toBeCloseTo(TUBE.length / 2, 3);
  });
  it('crystals that do not lodge pass through and leave at the outflow end', () => {
    const passer = crystals.find((c) => !c.willLodge)!;
    expect(inflowState(passer, passer.enterAt + 0.2).visible).toBe(true);
    expect(inflowState(passer, passer.enterAt + 0.3).visible).toBe(false);
  });
  it('lodged crystals stop where they stuck and sit against the wall, inside the lumen', () => {
    const lodger = crystals.find((c) => c.willLodge)!;
    const a = inflowState(lodger, lodger.enterAt + 0.5);
    const b = inflowState(lodger, 1);
    expect(a.lodged).toBe(true);
    expect(b.s).toBeCloseTo(lodger.lodgeS, 9);
    const p = inflowPoint(lodger, b);
    const r = Math.hypot(p[0], p[1]);
    expect(r).toBeGreaterThan(0.5 * lumenRadiusAt(p[2]));
    expect(r).toBeLessThan(lumenRadiusAt(p[2]));
  });
  it('lodge points are capped for the shader and grow with progress', () => {
    expect(lodgedPoints(crystals, 0.1)).toHaveLength(0);
    const mid = lodgedPoints(crystals, 0.6).length;
    const end = lodgedPoints(crystals, 1).length;
    expect(mid).toBeGreaterThan(0);
    expect(end).toBeGreaterThanOrEqual(mid);
    expect(end).toBeLessThanOrEqual(MAX_LODGES);
  });
  it('is reversible: progress is all it depends on', () => {
    expect(lodgedPoints(crystals, 0.7)).toEqual(lodgedPoints(crystals, 0.7));
    expect(lodgedPoints(crystals, 0.1)).toHaveLength(0);
  });
});

describe('obstruction and filtrate', () => {
  const crystals = buildInflow();
  it('rises from 0 (clear in 3.1) toward ~1 as crystals lodge, monotonically', () => {
    expect(obstructionLevel(crystals, 0.2)).toBe(0);
    let prev = 0;
    for (let p = 0; p <= 1; p += 0.02) {
      const o = obstructionLevel(crystals, p);
      expect(o).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = o;
    }
    expect(obstructionLevel(crystals, 1)).toBeGreaterThan(0.8);
    expect(obstructionLevel(crystals, 1)).toBeLessThanOrEqual(0.95);
  });
  it('slows the filtrate by up to 80% (spec formula)', () => {
    expect(filtrateSpeed(0)).toBe(FILTRATE.speed);
    expect(filtrateSpeed(1)).toBeCloseTo(FILTRATE.speed * 0.2, 9);
    expect(filtrateSpeed(0.5)).toBeCloseTo(FILTRATE.speed * 0.6, 9);
    expect(filtrateSpeed(5)).toBeCloseTo(FILTRATE.speed * 0.2, 9);
  });
});

describe('overlays', () => {
  it('overlays and the mechanism choice only apply from step 3.3', () => {
    expect(overlayStrength(0.4)).toBe(0);
    expect(overlayStrength(0.6)).toBe(1);
    expect(effectiveMechanism('histone', 0.4)).toBe('obstruction');
    expect(effectiveMechanism('histone', 0.6)).toBe('histone');
    expect(effectiveMechanism('vasoconstriction', 0.9)).toBe('vasoconstriction');
  });
  it('falls back to obstruction for unknown choices', () => {
    expect(effectiveMechanism(undefined, 0.9)).toBe('obstruction');
    expect(effectiveMechanism('nonsense', 0.9)).toBe('obstruction');
  });
  it('the feedback loop appears with step 3.4', () => {
    expect(feedbackStrength(0.7)).toBe(0);
    expect(feedbackStrength(0.9)).toBe(1);
  });
});
