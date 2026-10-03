import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('preloads each distinct file a scene needs', async () => {
    const { preloadScene } = await import('./useModel');
    preloadScene(manifest, 0, 'high');
    const preload = (useGLTF as unknown as { preload: ReturnType<typeof vi.fn> }).preload;
    expect(preload).toHaveBeenCalledTimes(2);
    preloadScene(manifest, 3, 'high');
    expect(preload).toHaveBeenCalledTimes(2);
  });
});
