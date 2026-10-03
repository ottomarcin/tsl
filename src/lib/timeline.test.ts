import { describe, expect, it } from 'vitest';
import {
  CLOUD_SPAN,
  CLOUD_START,
  MASS_TURN,
  cameraPoseAt,
  cascadePresence,
  cloudTransition,
  idleSway,
  localProgress,
  massRotation,
  type CameraContext,
} from './timeline';

const ctx: CameraContext = { massDistance: 14, cascadeDistance: 12, cascadeTargetY: -5.4, keepFullFraming: false };

describe('localProgress', () => {
  it('is 0–1 inside a scene and clamped outside it', () => {
    expect(localProgress(1.25, 1)).toBeCloseTo(0.25, 9);
    expect(localProgress(0.4, 1)).toBe(0);
    expect(localProgress(3.4, 1)).toBe(1);
  });
});

describe('mass rotation', () => {
  it('turns with the scroll through Scene 0 and holds still from Scene 1 on', () => {
    expect(massRotation(1)).toBeCloseTo(massRotation(1.5), 9);
    expect(massRotation(1)).toBeCloseTo(massRotation(2.5), 9);
    expect(massRotation(0.5)).toBeGreaterThan(massRotation(0));
    expect(massRotation(1) - massRotation(0)).toBeCloseTo(MASS_TURN, 9);
  });
  it('is monotonic', () => {
    let prev = -1;
    for (let g = 0; g <= 1; g += 0.05) {
      const r = massRotation(g);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });
  it('idle sway fades to exactly zero by the end of Scene 0, so the hand-over has no step', () => {
    expect(idleSway(1, 1.3)).toBe(0);
    expect(idleSway(1.5, 2.1)).toBe(0);
    expect(Math.abs(idleSway(0.2, 4.4))).toBeGreaterThan(0);
    expect(Math.abs(idleSway(0.2, 4.4))).toBeLessThanOrEqual(0.12);
  });
});

describe('camera', () => {
  it('starts framing the whole mass', () => {
    const p = cameraPoseAt(0, ctx);
    expect(p.position).toEqual([0, 0, 14]);
    expect(p.target).toEqual([0, 0, 0]);
    expect(p.fov).toBe(50);
  });

  it('is continuous across every scene boundary and through the hand-over: no jump anywhere', () => {
    for (const boundary of [1, CLOUD_START, 2, 2.5]) {
      const a = cameraPoseAt(boundary - 1e-6, ctx);
      const b = cameraPoseAt(boundary + 1e-6, ctx);
      expect(b.position[2]).toBeCloseTo(a.position[2], 3);
      expect(b.position[1]).toBeCloseTo(a.position[1], 3);
      expect(b.target[1]).toBeCloseTo(a.target[1], 3);
      expect(b.fov).toBeCloseTo(a.fov, 3);
    }
  });

  it('never moves faster than a small step between neighbouring points on the timeline', () => {
    let prev = cameraPoseAt(0, ctx);
    for (let g = 0.01; g <= 3.2; g += 0.01) {
      const p = cameraPoseAt(g, ctx);
      expect(Math.abs(p.position[2] - prev.position[2])).toBeLessThan(2.2);
      expect(Math.abs(p.position[1] - prev.position[1])).toBeLessThan(2.2);
      expect(Math.abs(p.fov - prev.fov)).toBeLessThan(2);
      prev = p;
    }
  });

  it('pushes in a little toward the end of Scene 0 and pulls back through Scene 1', () => {
    expect(cameraPoseAt(0.95, ctx).position[2]).toBeLessThan(cameraPoseAt(0.5, ctx).position[2]);
    expect(cameraPoseAt(CLOUD_START, ctx).position[2]).toBeGreaterThan(cameraPoseAt(1.3, ctx).position[2]);
  });

  it('every scene start looks like its scene: at g = 2 the camera is already on the cascade', () => {
    const p = cameraPoseAt(2, ctx);
    expect(p.position[2]).toBeCloseTo(12, 6);
    expect(p.target[1]).toBeCloseTo(-5.4, 6);
  });

  it('arrives on the cascade framing and holds it', () => {
    for (const g of [2, 2.2, 2.6, 3, 4]) {
      const p = cameraPoseAt(g, ctx);
      expect(p.position[2]).toBeCloseTo(12, 6);
      expect(p.position[1]).toBeCloseTo(-5.4, 6);
      expect(p.target[1]).toBeCloseTo(-5.4, 6);
      expect(p.fov).toBe(50);
    }
  });

  it('keeps the full mass framing on narrow layouts instead of pushing in', () => {
    const narrow = { ...ctx, keepFullFraming: true };
    expect(cameraPoseAt(0.95, narrow).position[2]).toBeGreaterThanOrEqual(14);
    expect(cameraPoseAt(1.2, narrow).position[2]).toBeGreaterThanOrEqual(14);
  });
});

describe('cascade hand-over', () => {
  it('cloud transition runs over the end of Scene 1 and is complete when Scene 2 starts', () => {
    expect(cloudTransition(1.5)).toBe(0);
    expect(cloudTransition(CLOUD_START)).toBe(0);
    expect(cloudTransition(2)).toBe(1);
    expect(cloudTransition(2.9)).toBe(1);
    expect(CLOUD_START).toBeCloseTo(2 - CLOUD_SPAN, 9);
  });
  it('the static props fade in after the camera starts moving, and are fully there when Scene 2 starts', () => {
    expect(cascadePresence(1.5)).toBe(0);
    expect(cascadePresence(CLOUD_START)).toBe(0);
    expect(cascadePresence(2)).toBe(1);
  });
});
