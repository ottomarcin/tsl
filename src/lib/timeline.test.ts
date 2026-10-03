import { describe, expect, it } from 'vitest';
import {
  CLOUD_SPAN,
  CLOUD_START,
  SCENE3_OFFSET,
  TUBULE_LOOK_DY,
  TUBULE_START,
  tubulePresence,
  tubuleScale,
  tubuleTransition,
  KIDNEY_ZOOM_DISTANCE,
  SCENE4_OFFSET,
  SYSTEMIC_SPAN,
  SYSTEMIC_START,
  REWIND_SPAN,
  REWIND_START,
  rewindTransition,
  systemicPresence,
  systemicTransition,
  TUBULE_BIRTH_SCALE,
  MASS_TURN,
  cameraPoseAt,
  cascadePresence,
  cloudTransition,
  idleSway,
  localProgress,
  massRotation,
  type CameraContext,
} from './timeline';

const ctx: CameraContext = { massDistance: 14, cascadeDistance: 12, cascadeTargetY: -5.4, tubuleDistance: 13, systemicDistance: 15, systemicTargetY: -10.6, keepFullFraming: false };

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
    for (const boundary of [1, CLOUD_START, 2, 2.5, TUBULE_START, 3]) {
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
    for (let g = 0.01; g <= 5.2; g += 0.01) {
      const p = cameraPoseAt(g, ctx);
      expect(Math.abs(p.position[2] - prev.position[2])).toBeLessThan(2.2);
      // The flight down to the nephron covers ~17 units over 0.14 of the timeline.
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

  it('arrives on the cascade framing and holds it until the flight down', () => {
    for (const g of [2, 2.2, 2.6, TUBULE_START]) {
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

describe('nephron hand-over: dive into the kidney, then the tubule', () => {
  const dive = (u: number) => TUBULE_START + u * (3 - TUBULE_START);

  it('every scene start looks like its scene: at g = 3 the camera is on the tubule, which sits where the kidney is', () => {
    const p = cameraPoseAt(3, ctx);
    expect(p.position[1]).toBeCloseTo(SCENE3_OFFSET[1] + TUBULE_LOOK_DY, 6);
    expect(p.target[1]).toBeCloseTo(SCENE3_OFFSET[1] + TUBULE_LOOK_DY, 6);
    expect(p.position[2]).toBeCloseTo(13, 6);
  });

  it('the tubule is centred on the kidney, so it appears inside it', () => {
    expect(SCENE3_OFFSET[1]).toBeCloseTo(-4.3 - 5.45, 6);
  });

  it('first pushes in on the kidney until it fills the frame', () => {
    const near = cameraPoseAt(dive(0.55), ctx);
    expect(near.position[2]).toBeCloseTo(KIDNEY_ZOOM_DISTANCE, 6);
    expect(near.target[1]).toBeCloseTo(SCENE3_OFFSET[1], 6);
    expect(near.position[2]).toBeLessThan(cameraPoseAt(TUBULE_START, ctx).position[2]);
    // Distance falls steadily through the push-in.
    let prev = Infinity;
    for (let u = 0; u <= 0.55; u += 0.05) {
      const d = cameraPoseAt(dive(u), ctx).position[2];
      expect(d).toBeLessThanOrEqual(prev + 1e-9);
      prev = d;
    }
  });

  it('then settles back out to frame the tubule, which has grown to full size', () => {
    expect(cameraPoseAt(dive(0.8), ctx).position[2]).toBeGreaterThan(KIDNEY_ZOOM_DISTANCE);
    expect(cameraPoseAt(dive(1), ctx).position[2]).toBeCloseTo(13, 6);
  });

  it('the tubule is born small, inside the kidney, and grows only once the camera is in close', () => {
    expect(tubuleScale(TUBULE_START)).toBeCloseTo(TUBULE_BIRTH_SCALE, 9);
    expect(tubuleScale(dive(0.3))).toBeCloseTo(TUBULE_BIRTH_SCALE, 9);
    expect(tubuleScale(3)).toBe(1);
    let prev = 0;
    for (let u = 0; u <= 1; u += 0.05) {
      const k = tubuleScale(dive(u));
      expect(k).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = k;
    }
  });

  it('the tubule fades in as the kidney fills the frame, and the cascade fades out behind it, with an overlap', () => {
    expect(tubulePresence(dive(0.3))).toBe(0);
    expect(tubulePresence(dive(0.9))).toBe(1);
    expect(cascadePresence(dive(0.1))).toBe(1);
    expect(cascadePresence(dive(0.95))).toBe(0);
    expect(cascadePresence(3)).toBe(0);
    // Somewhere in the middle both are partly there: a cross-fade, not a cut.
    const mid = dive(0.62);
    expect(cascadePresence(mid)).toBeGreaterThan(0);
    expect(cascadePresence(mid)).toBeLessThan(1);
    expect(tubulePresence(mid)).toBeGreaterThan(0);
  });

  it('the dive completes at the scene start and creeps in a little through Scene 3, then holds', () => {
    expect(tubuleTransition(TUBULE_START)).toBe(0);
    expect(tubuleTransition(3)).toBe(1);
    expect(cameraPoseAt(3.6, ctx).position[2]).toBeLessThan(cameraPoseAt(3, ctx).position[2]);
    expect(cameraPoseAt(4, ctx).position[2]).toBeCloseTo(cameraPoseAt(4.5, ctx).position[2], 9);
  });
});

describe('systemic hand-over: the tubule gives way to the heart and hand', () => {
  it('Scene 4 is built around the same point as the tubule, so the hand-over is a cross-fade in place', () => {
    expect(SCENE4_OFFSET).toEqual(SCENE3_OFFSET);
  });
  it('every scene start looks like its scene: at g = 4 the camera is on the panels', () => {
    const p = cameraPoseAt(4, ctx);
    expect(p.position[1]).toBeCloseTo(-10.6, 6);
    expect(p.target[1]).toBeCloseTo(-10.6, 6);
    expect(p.position[2]).toBeCloseTo(15, 6);
    expect(cameraPoseAt(4.5, ctx)).toEqual(cameraPoseAt(4, ctx));
  });
  it('moves only over the last stretch of Scene 3, and without a jump at either end', () => {
    expect(SYSTEMIC_START).toBeCloseTo(4 - SYSTEMIC_SPAN, 9);
    expect(cameraPoseAt(3.5, ctx).position[2]).toBeCloseTo(cameraPoseAt(3.5, ctx).position[2], 9);
    const a = cameraPoseAt(SYSTEMIC_START - 1e-6, ctx);
    const b = cameraPoseAt(SYSTEMIC_START + 1e-6, ctx);
    expect(b.position[2]).toBeCloseTo(a.position[2], 3);
    expect(b.target[1]).toBeCloseTo(a.target[1], 3);
  });
  it('the panels fade in as the tubule fades out, with an overlap', () => {
    expect(systemicTransition(SYSTEMIC_START)).toBe(0);
    expect(systemicTransition(4)).toBe(1);
    expect(systemicPresence(3.5)).toBe(0);
    expect(systemicPresence(4)).toBe(1);
    expect(tubulePresence(3.5)).toBe(1);
    expect(tubulePresence(4)).toBe(0);
    const mid = SYSTEMIC_START + 0.08;
    expect(tubulePresence(mid)).toBeGreaterThan(0);
    expect(tubulePresence(mid)).toBeLessThan(1);
    expect(systemicPresence(mid)).toBeGreaterThan(0);
  });
});

describe('rewind hand-over: the panels give way to the cascade again (Scene 5)', () => {
  it('runs over the end of Scene 4', () => {
    expect(REWIND_START).toBeCloseTo(5 - REWIND_SPAN, 9);
    expect(rewindTransition(4.5)).toBe(0);
    expect(rewindTransition(5)).toBe(1);
  });
  it('every scene start looks like its scene: at g = 5 the camera frames the cascade', () => {
    const p = cameraPoseAt(5, ctx);
    expect(p.position[1]).toBeCloseTo(ctx.cascadeTargetY, 6);
    expect(p.position[2]).toBeCloseTo(ctx.cascadeDistance, 6);
    expect(cameraPoseAt(5.7, ctx)).toEqual(cameraPoseAt(5, ctx));
  });
  it('has no jump where it starts or ends', () => {
    for (const boundary of [REWIND_START, 5]) {
      const a = cameraPoseAt(boundary - 1e-6, ctx);
      const b = cameraPoseAt(boundary + 1e-6, ctx);
      expect(b.position[2]).toBeCloseTo(a.position[2], 3);
      expect(b.position[1]).toBeCloseTo(a.position[1], 3);
    }
  });
  it('the cascade returns as the panels fade, with an overlap in time but not at the extremes', () => {
    expect(cascadePresence(4.5)).toBe(0);
    expect(cascadePresence(5)).toBe(1);
    expect(systemicPresence(4.5)).toBe(1);
    expect(systemicPresence(5)).toBe(0);
    const mid = REWIND_START + 0.08;
    expect(cascadePresence(mid)).toBeGreaterThan(0);
    expect(systemicPresence(mid)).toBeGreaterThan(0);
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
