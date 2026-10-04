import { describe, expect, it } from 'vitest';
import { HAND_CENTER_Y, HAND_CLOSEUP_LIFT, HAND_PIVOT, HAND_TIP_Y, SYSTEMIC_LAYOUTS } from './layout';
import { HAND_TURN, handView } from './handView';
import { handCloseUp } from '../../lib/systemic';

describe.each(Object.entries(SYSTEMIC_LAYOUTS))('handView in the %s layout', (_name, spec) => {
  const s = spec.hand.scale;
  const [x, y] = spec.hand.position;

  it('at rest is the hand exactly as the panel lays it out', () => {
    const v = handView(0.3, spec);
    expect(v.turn).toBe(0);
    expect(v.scale).toBe(s);
    expect(v.pivot[0]).toBe(x);
    // The palm sits where it would with the model centred on the panel.
    expect(v.pivot[1]).toBeCloseTo(y + (HAND_PIVOT.y - HAND_CENTER_Y) * s, 9);
  });

  it('does not move before the spasm reaches the screen, and has finished by the end of step 4.3 into 4.4', () => {
    expect(handView(0.55, spec)).toEqual(handView(0, spec));
    const end = handView(0.85, spec);
    expect(end.turn).toBeCloseTo(HAND_TURN, 9);
    expect(end.scale).toBeCloseTo(s * spec.hand.zoom, 9);
    expect(handView(1, spec)).toEqual(end);
  });

  it('turns first and zooms after: at the half-way point of the turn the zoom has hardly begun', () => {
    const mid = 0.66;
    expect(handCloseUp(mid).turn).toBeGreaterThan(0.4);
    expect(handCloseUp(mid).zoom).toBe(0);
  });

  it('puts the hand level with the heart at the close-up when the panels sit side by side (the palm a little above its centre, the forearm hangs below), and moves there smoothly', () => {
    if (spec.hand.closeUpY === undefined) return;
    expect(handView(0.85, spec).pivot[1]).toBeCloseTo(spec.hand.closeUpY, 9);
    expect(spec.hand.closeUpY).toBeCloseTo(spec.heart.position[1] + HAND_CLOSEUP_LIFT, 9);
    let last = handView(0, spec).pivot[1];
    for (let p = 0.01; p <= 1; p += 0.01) {
      const v = handView(p, spec).pivot[1];
      expect(Math.abs(v - last)).toBeLessThan(0.1);
      last = v;
    }
  });

  it('otherwise keeps the fingertips at the same height on screen while it grows', () => {
    if (spec.hand.closeUpY !== undefined) return;
    const tipAt = (p: number) => {
      const v = handView(p, spec);
      return v.pivot[1] + (HAND_TIP_Y - HAND_PIVOT.y) * v.scale;
    };
    for (const p of [0.3, 0.64, 0.7, 0.75, 0.9]) expect(tipAt(p)).toBeCloseTo(tipAt(0), 9);
  });

  it('grows and turns monotonically', () => {
    let last = handView(0, spec);
    for (let p = 0.01; p <= 1; p += 0.01) {
      const v = handView(p, spec);
      expect(v.scale).toBeGreaterThanOrEqual(last.scale - 1e-12);
      expect(Math.abs(v.turn)).toBeGreaterThanOrEqual(Math.abs(last.turn) - 1e-12);
      last = v;
    }
  });

  it('cuts the arm above the label, and never inside the hand', () => {
    const v = handView(0.9, spec);
    expect(v.cutY).toBeLessThan(y);
    // The palm and everything above it stays well clear of the cut at the close-up.
    expect(v.pivot[1]).toBeGreaterThan(v.cutY + v.cutFade);
  });

  it('puts the part of the arm that would hang below the cut out of the frame at the close-up', () => {
    const v = handView(0.9, spec);
    const elbowY = v.pivot[1] - (HAND_PIVOT.y - -0.06) * v.scale;
    expect(elbowY).toBeLessThan(v.cutY);
  });
});
