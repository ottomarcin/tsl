import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirstRunHint } from './useFirstRunHint';

describe('useFirstRunHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is not visible immediately on mount', () => {
    const { result } = renderHook(() => useFirstRunHint());
    expect(result.current.visible).toBe(false);
  });

  it('becomes visible after the delay if never seen before', () => {
    const { result } = renderHook(() => useFirstRunHint(1500));
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.visible).toBe(true);
  });

  it('never becomes visible if already dismissed in a previous session', () => {
    window.localStorage.setItem('hasSeenScrollHint', 'true');
    const { result } = renderHook(() => useFirstRunHint(1500));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.visible).toBe(false);
  });

  it('dismiss() hides it and persists so it never appears again', () => {
    const { result } = renderHook(() => useFirstRunHint(1500));
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.visible).toBe(true);

    act(() => result.current.dismiss());
    expect(result.current.visible).toBe(false);
    expect(window.localStorage.getItem('hasSeenScrollHint')).toBe('true');
  });

  it('auto-dismisses on the first wheel scroll event', () => {
    const { result } = renderHook(() => useFirstRunHint(1500));
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.visible).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('wheel'));
    });
    expect(result.current.visible).toBe(false);
  });

  it('does not throw when localStorage is unavailable', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useFirstRunHint(1500));
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.visible).toBe(true);
    expect(() => act(() => result.current.dismiss())).not.toThrow();
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
