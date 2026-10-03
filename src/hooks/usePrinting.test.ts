import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePrinting } from './usePrinting';

describe('usePrinting', () => {
  it('is on between beforeprint and afterprint', () => {
    const { result } = renderHook(() => usePrinting());
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event('beforeprint')));
    expect(result.current).toBe(true);
    act(() => window.dispatchEvent(new Event('afterprint')));
    expect(result.current).toBe(false);
  });
});
