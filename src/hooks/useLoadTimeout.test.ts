import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOAD_TIMEOUT_MS, useLoadTimeout } from './useLoadTimeout';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useLoadTimeout', () => {
  it('fires once when loading stays active for 30 seconds', () => {
    const onTimeout = vi.fn();
    renderHook(() => useLoadTimeout(true, onTimeout));
    act(() => vi.advanceTimersByTime(LOAD_TIMEOUT_MS - 1));
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeout).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
  it('does not fire when loading finishes in time, and starts the clock again for the next load', () => {
    const onTimeout = vi.fn();
    const { rerender } = renderHook(({ loading }) => useLoadTimeout(loading, onTimeout), { initialProps: { loading: true } });
    act(() => vi.advanceTimersByTime(20_000));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(60_000));
    expect(onTimeout).not.toHaveBeenCalled();
    rerender({ loading: true });
    act(() => vi.advanceTimersByTime(20_000));
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
  it('does nothing while nothing is loading', () => {
    const onTimeout = vi.fn();
    renderHook(() => useLoadTimeout(false, onTimeout));
    act(() => vi.advanceTimersByTime(120_000));
    expect(onTimeout).not.toHaveBeenCalled();
  });
  it('calls the latest callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useLoadTimeout(true, cb), { initialProps: { cb: first } });
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(LOAD_TIMEOUT_MS));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
