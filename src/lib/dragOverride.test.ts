import { describe, expect, it } from 'vitest';
import { DragOverride } from './dragOverride';

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
});
