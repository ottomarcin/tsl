import { describe, expect, it } from 'vitest';
import { Color, MeshStandardMaterial } from 'three';
import { applyGlow, captureEmissive, liftEmissive } from './emissive';

describe('liftEmissive', () => {
  it('raises a faint emissive so its brightest channel reaches the target', () => {
    const m = new MeshStandardMaterial({ emissive: new Color(0.001, 0.0005, 0.0009) });
    liftEmissive(m, 0.05);
    expect(m.emissive.r * m.emissiveIntensity).toBeCloseTo(0.05, 4);
  });
  it('leaves absent or already-bright emissives alone', () => {
    const none = new MeshStandardMaterial();
    liftEmissive(none);
    expect(none.emissiveIntensity).toBe(1);
    const bright = new MeshStandardMaterial({ emissive: new Color(0.6, 0, 0) });
    liftEmissive(bright);
    expect(bright.emissiveIntensity).toBe(1);
  });
  it('does nothing when the target is zero', () => {
    const m = new MeshStandardMaterial({ emissive: new Color(0.001, 0, 0) });
    liftEmissive(m, 0);
    expect(m.emissiveIntensity).toBe(1);
  });
});

describe('applyGlow', () => {
  const make = () => {
    const m = new MeshStandardMaterial({ emissive: new Color(0.001, 0.001, 0.001) });
    liftEmissive(m, 0.05); // large intensity on a near-black colour, like the real files
    return m;
  };
  it('reproduces the resting glow with no boost and no glow', () => {
    const m = make();
    const rest = captureEmissive(m);
    const before = m.emissive.r * m.emissiveIntensity;
    applyGlow(m, rest, new Color(1, 0, 0), 0, 0);
    expect(m.emissive.r * m.emissiveIntensity).toBeCloseTo(before, 6);
  });
  it('adds the glow colour on top of the boosted rest glow', () => {
    const m = make();
    const rest = captureEmissive(m);
    applyGlow(m, rest, new Color(1, 0, 0), 0.1, 1);
    expect(m.emissive.r).toBeCloseTo(0.05 * 2 + 0.1, 5);
    expect(m.emissive.g).toBeCloseTo(0.05 * 2, 5);
  });
  it('never compounds: applying the same glow repeatedly gives the same result', () => {
    const m = make();
    const rest = captureEmissive(m);
    applyGlow(m, rest, new Color(1, 0, 0), 0.1, 0.5);
    const once = m.emissive.clone();
    for (let i = 0; i < 50; i++) applyGlow(m, rest, new Color(1, 0, 0), 0.1, 0.5);
    expect(m.emissive.equals(once)).toBe(true);
  });
  it('stays well below blown-out for the kidney-style glow', () => {
    const m = make();
    const rest = captureEmissive(m);
    applyGlow(m, rest, new Color('#C9C0A8'), 0.1, 1.2);
    expect(Math.max(m.emissive.r, m.emissive.g, m.emissive.b)).toBeLessThan(0.3);
  });
});
