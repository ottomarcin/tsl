import { describe, expect, it } from 'vitest';
import { DragOverride, HOLD_MS } from './dragOverride';

describe('DragOverride', () => {
  it('passes scroll progress through when nothing is being dragged', () => {
    const d = new DragOverride();
    expect(d.resolve(0.4)).toBe(0.4);
    expect(d.active).toBe(false);
  });

  it('returns the dragged value exactly while the pointer is down, whatever scroll says', () => {
    const d = new DragOverride();
    d.start(0.3);
    expect(d.active).toBe(true);
    expect(d.resolve(0.1)).toBe(0.3);
    d.move(0.5);
    expect(d.resolve(0.1)).toBe(0.5);
  });

  it('holds the value after release until scroll catches up, then hands back without a jump', () => {
    const d = new DragOverride(0.01);
    d.start(0.5);
    d.end();
    expect(d.resolve(0.2)).toBe(0.5);
    expect(d.resolve(0.45)).toBe(0.5);
    expect(d.resolve(0.495)).toBe(0.495);
    expect(d.resolve(0.2)).toBe(0.2); // released for good
  });

  it('cancel() hands control back immediately after release (visitor scrolled)', () => {
    const d = new DragOverride();
    d.start(0.5);
    d.end();
    d.cancel();
    expect(d.resolve(0.2)).toBe(0.2);
  });

  it('cancel() does nothing mid-drag (wheel while holding the bar)', () => {
    const d = new DragOverride();
    d.start(0.5);
    d.cancel();
    expect(d.resolve(0.2)).toBe(0.5);
  });

  it('ignores move() when not dragging', () => {
    const d = new DragOverride();
    d.move(0.9);
    expect(d.resolve(0.2)).toBe(0.2);
  });

  describe('when the scroll never catches up (a jump from the menu after a drag)', () => {
    it('lets go after a short hold instead of pinning the bar at the dragged spot', () => {
      let now = 1000;
      const d = new DragOverride(0.01, () => now);
      d.start(0.5);
      d.end();
      now += HOLD_MS - 1;
      expect(d.resolve(1)).toBe(0.5); // still holding
      now += 2;
      expect(d.resolve(1)).toBe(1); // scroll is far away (another scene): authoritative again
      expect(d.resolve(0.9)).toBe(0.9); // and it stays handed back
    });
    it('never expires mid-drag, however long the pointer is held', () => {
      let now = 0;
      const d = new DragOverride(0.01, () => now);
      d.start(0.5);
      now += 60_000;
      expect(d.resolve(0.1)).toBe(0.5);
    });
  });

  it('reset() forgets everything at once, even mid-drag', () => {
    const d = new DragOverride();
    d.start(0.5);
    d.reset();
    expect(d.active).toBe(false);
    expect(d.resolve(0.2)).toBe(0.2);
  });
});
