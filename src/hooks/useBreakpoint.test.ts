import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { breakpointForWidth, useBreakpoint } from './useBreakpoint';

describe('breakpointForWidth', () => {
  it('follows the design spec breakpoints', () => {
    expect(breakpointForWidth(320)).toBe('mobile');
    expect(breakpointForWidth(767)).toBe('mobile');
    expect(breakpointForWidth(768)).toBe('tablet');
    expect(breakpointForWidth(1279)).toBe('tablet');
    expect(breakpointForWidth(1280)).toBe('desktop');
    expect(breakpointForWidth(1920)).toBe('desktop');
  });
});

describe('useBreakpoint', () => {
  it('tracks window resizes', () => {
    window.innerWidth = 1440;
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');
    act(() => {
      window.innerWidth = 390;
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('mobile');
    act(() => {
      window.innerWidth = 900;
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('tablet');
    window.innerWidth = 1024;
  });
});
