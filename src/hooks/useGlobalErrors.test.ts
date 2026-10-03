import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGlobalErrors } from './useGlobalErrors';

const fireError = (error: unknown, message = 'x') => window.dispatchEvent(new ErrorEvent('error', { error, message }));
const fireRejection = (reason: unknown) => {
  const event = new Event('unhandledrejection') as Event & { reason?: unknown };
  event.reason = reason;
  window.dispatchEvent(event);
};

describe('useGlobalErrors', () => {
  it('reports an uncaught error and an unhandled rejection', () => {
    const onError = vi.fn();
    renderHook(() => useGlobalErrors(onError));
    fireError(new Error('boom'));
    fireRejection(new Error('late boom'));
    expect(onError).toHaveBeenCalledTimes(2);
  });
  it('ignores browser noise and failed downloads (those have their own message)', () => {
    const onError = vi.fn();
    renderHook(() => useGlobalErrors(onError));
    fireError(new Error('ResizeObserver loop completed with undelivered notifications.'));
    fireRejection(new Error('Could not load /models/x.glb: 404'));
    fireRejection(new TypeError('Failed to fetch'));
    expect(onError).not.toHaveBeenCalled();
  });
  it('stops listening when unmounted', () => {
    const removed: string[] = [];
    const spy = vi.spyOn(window, 'removeEventListener').mockImplementation((type: string) => void removed.push(type));
    const { unmount } = renderHook(() => useGlobalErrors(vi.fn()));
    unmount();
    spy.mockRestore();
    expect(removed).toEqual(expect.arrayContaining(['error', 'unhandledrejection']));
  });
});
