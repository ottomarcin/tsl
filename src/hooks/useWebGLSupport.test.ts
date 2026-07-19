import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWebGLSupport } from './useWebGLSupport';

describe('useWebGLSupport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when a WebGL context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (type: string) => (type === 'webgl2' ? ({} as unknown as RenderingContext) : null),
    );
    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(true);
  });

  it('returns false when no WebGL context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(false);
  });
});
