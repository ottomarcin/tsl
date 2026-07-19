import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectWebGLSupport } from './webgl';

describe('detectWebGLSupport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when webgl2 context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (type: string) => (type === 'webgl2' ? ({} as unknown as RenderingContext) : null),
    );
    expect(detectWebGLSupport()).toBe(true);
  });

  it('returns true when only the legacy webgl context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (type: string) => (type === 'webgl' ? ({} as unknown as RenderingContext) : null),
    );
    expect(detectWebGLSupport()).toBe(true);
  });

  it('returns false when no WebGL context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    expect(detectWebGLSupport()).toBe(false);
  });

  it('returns false rather than throwing when getContext itself throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('no webgl');
    });
    expect(detectWebGLSupport()).toBe(false);
  });
});
