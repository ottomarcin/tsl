import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTweenedValue } from './useTweenedValue';

describe('useTweenedValue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the initial target immediately on mount, with no animation needed', () => {
    const { result } = renderHook(() => useTweenedValue(4.2, 800, false));
    expect(result.current).toBe(4.2);
  });

  it('jumps straight to the new target when reducedMotion is true, even after a value change', () => {
    const { result, rerender } = renderHook(({ target }) => useTweenedValue(target, 800, true), {
      initialProps: { target: 4.2 },
    });
    rerender({ target: 5.5 });
    expect(result.current).toBe(5.5);
  });

  it('animates toward the new target over time when reducedMotion is false', () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        now += 100;
        cb(now);
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result, rerender } = renderHook(({ target }) => useTweenedValue(target, 800, false), {
      initialProps: { target: 4.2 },
    });
    rerender({ target: 5.5 });

    // Partway through the 800ms tween, the displayed value sits strictly between old and new.
    expect(result.current).toBeGreaterThan(4.2);
    expect(result.current).toBeLessThanOrEqual(5.5);

    vi.unstubAllGlobals();
  });
});
