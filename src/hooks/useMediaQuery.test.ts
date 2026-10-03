import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  it('returns the current match and updates on change', () => {
    let handler: ((e: MediaQueryListEvent) => void) | null = null;
    const mql = {
      matches: false,
      addEventListener: vi.fn((_: string, h: (e: MediaQueryListEvent) => void) => {
        handler = h;
      }),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
    const { result, unmount } = renderHook(() => useMediaQuery('(max-height: 560px)'));
    expect(result.current).toBe(false);
    act(() => handler?.({ matches: true } as MediaQueryListEvent));
    expect(result.current).toBe(true);
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });
});
