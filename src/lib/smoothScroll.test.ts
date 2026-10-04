import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_SCROLL_MS, scrollDuration, smoothScrollTo } from './smoothScroll';

describe('scrollDuration', () => {
  it('is quick for a short step and never longer than the cap, however far', () => {
    expect(scrollDuration(700)).toBeLessThan(500);
    expect(scrollDuration(100_000)).toBe(MAX_SCROLL_MS);
    expect(MAX_SCROLL_MS).toBeLessThanOrEqual(800);
  });
  it('does not depend on the direction', () => {
    expect(scrollDuration(-1500)).toBe(scrollDuration(1500));
  });
});

describe('smoothScrollTo', () => {
  let now = 0;
  const frames: FrameRequestCallback[] = [];
  beforeEach(() => {
    now = 0;
    frames.length = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => frames.splice(0, frames.length));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  const tick = (ms: number) => {
    now += ms;
    const cb = frames.shift();
    cb?.(now);
  };
  const element = (scrollTop = 0) => Object.assign(document.createElement('div'), { scrollTop }) as HTMLDivElement;

  it('arrives exactly at the target, in the time it said, even when frames are dropped', () => {
    const el = element(0);
    const done = vi.fn();
    smoothScrollTo(el, 3640, done);
    tick(300);
    expect(el.scrollTop).toBeGreaterThan(0);
    expect(el.scrollTop).toBeLessThan(3640);
    expect(done).not.toHaveBeenCalled();
    // One long frame past the end: it still lands, and on time.
    tick(MAX_SCROLL_MS);
    expect(el.scrollTop).toBe(3640);
    expect(done).toHaveBeenCalledTimes(1);
    expect(now).toBeLessThanOrEqual(300 + MAX_SCROLL_MS);
  });
  it('moves monotonically towards the target', () => {
    const el = element(1000);
    smoothScrollTo(el, 0);
    let last = el.scrollTop;
    for (let i = 0; i < 40 && frames.length; i++) {
      tick(20);
      expect(el.scrollTop).toBeLessThanOrEqual(last);
      last = el.scrollTop;
    }
    expect(el.scrollTop).toBe(0);
  });
  it('does not stop for wheel, touch or key events (trackpad momentum keeps arriving after a flick)', () => {
    const el = element(0);
    const done = vi.fn();
    smoothScrollTo(el, 2000, done);
    tick(100);
    for (const type of ['wheel', 'touchstart', 'keydown']) el.dispatchEvent(new Event(type));
    tick(100);
    expect(frames).toHaveLength(1);
    tick(MAX_SCROLL_MS);
    expect(el.scrollTop).toBe(2000);
    expect(done).toHaveBeenCalledTimes(1);
  });
  it('never runs backwards on a first frame stamped before it started', () => {
    const el = element(500);
    smoothScrollTo(el, 1500);
    tick(-8);
    expect(el.scrollTop).toBeGreaterThanOrEqual(500);
  });
  it('can be stopped by its caller, and stopping twice is harmless', () => {
    const el = element(0);
    const stop = smoothScrollTo(el, 500);
    tick(50);
    stop();
    stop();
    expect(frames).toHaveLength(0);
  });
  it('finishes at once when already there', () => {
    const done = vi.fn();
    smoothScrollTo(element(400), 400, done);
    expect(done).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);
  });
});
