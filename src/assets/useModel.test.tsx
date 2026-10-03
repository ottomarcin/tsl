import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelManifest } from '../content/schema';

const useGLTF = vi.fn((..._args: unknown[]) => ({ scene: {} }));
(useGLTF as unknown as { preload: unknown }).preload = vi.fn();
vi.mock('@react-three/drei', () => ({ useGLTF }));

const manifest: ModelManifest = {
  basePath: 'models/',
  version: '1',
  models: { cell: { standard: 'cell.glb', high: 'hd/cell.glb', lod: 'cell_lod1.glb', scenes: [0], usages: ['instanced', 'single'] } },
};

describe('useModel / preloadScene', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { useAppStore } = await import('../store/useAppStore');
    useAppStore.setState({ modelQuality: 'high' });
  });

  it('loads the file for the current tier with the self-hosted Draco decoder', async () => {
    const { useModel } = await import('./useModel');
    renderHook(() => useModel(manifest, 'cell', 'single'));
    expect(useGLTF).toHaveBeenCalledWith(expect.stringContaining('models/hd/cell.glb?v=1'), expect.stringMatching(/draco\/$/));
  });

  it('switches to the lighter file when the quality toggle changes', async () => {
    const { useModel } = await import('./useModel');
    const { useAppStore } = await import('../store/useAppStore');
    const { rerender } = renderHook(() => useModel(manifest, 'cell', 'single'));
    useAppStore.getState().setModelQuality('standard');
    rerender();
    const urls = useGLTF.mock.calls.map((c) => c[0] as string);
    expect(urls.at(-1)).toContain('models/cell.glb');
  });

  it('uses the instanced rule for hundreds of copies', async () => {
    const { useModel } = await import('./useModel');
    renderHook(() => useModel(manifest, 'cell', 'instanced'));
    expect(useGLTF.mock.calls[0][0]).toContain('models/cell.glb');
  });

  describe('preloadScene', () => {
    const preload = () => (useGLTF as unknown as { preload: ReturnType<typeof vi.fn> }).preload;
    const flush = () => new Promise((r) => setTimeout(r, 0));

    beforeEach(() => {
      vi.resetModules();
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    });
    afterEach(() => vi.unstubAllGlobals());

    it('preloads each distinct file a scene needs, once', async () => {
      const { preloadScene } = await import('./useModel');
      preloadScene(manifest, 0, 'high');
      preloadScene(manifest, 0, 'high');
      await flush();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(preload()).toHaveBeenCalledTimes(2);
      preloadScene(manifest, 3, 'high');
      await flush();
      expect(preload()).toHaveBeenCalledTimes(2);
    });

    it('does not hand a failing download to useGLTF.preload (it would become an unhandled rejection)', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
      const { preloadScene } = await import('./useModel');
      expect(() => preloadScene(manifest, 0, 'high')).not.toThrow();
      await flush();
      expect(preload()).not.toHaveBeenCalled();
    });

    it('skips error responses, and tries again on a later call', async () => {
      const f = vi.fn(async () => ({ ok: false }));
      vi.stubGlobal('fetch', f);
      const { preloadScene } = await import('./useModel');
      preloadScene(manifest, 0, 'high');
      await flush();
      expect(preload()).not.toHaveBeenCalled();
      preloadScene(manifest, 0, 'high');
      await flush();
      expect(f).toHaveBeenCalledTimes(4);
    });
  });
});
