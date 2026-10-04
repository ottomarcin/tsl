import { Component, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelManifest } from '../content/schema';

const useGLTF = vi.fn((..._args: unknown[]) => ({ scene: {} }));
(useGLTF as unknown as { preload: unknown }).preload = vi.fn();
(useGLTF as unknown as { clear: unknown }).clear = vi.fn();
vi.mock('@react-three/drei', () => ({ useGLTF }));

const manifest: ModelManifest = {
  basePath: 'models/',
  version: '1',
  models: { cell: { standard: 'cell.glb', high: 'hd/cell.glb', lod: 'cell_lod1.glb', scenes: [0], usages: ['instanced', 'single'] } },
};

/** Stands in for Suspense / the model boundary: swallows what the hook throws, so the test can look at what it left behind. */
class Swallow extends Component<{ children: ReactNode }, { stopped: boolean }> {
  state = { stopped: false };
  static getDerivedStateFromError() {
    return { stopped: true };
  }
  render() {
    return this.state.stopped ? null : this.props.children;
  }
}

describe('useModel', () => {
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

  it('remembers a failed download and clears just that one from the cache, so a retry asks the network again', async () => {
    const { useModel, clearFailedModels } = await import('./useModel');
    const clear = (useGLTF as unknown as { clear: ReturnType<typeof vi.fn> }).clear;
    useGLTF.mockImplementation(() => {
      throw new Error('404');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useModel(manifest, 'cell', 'single'), { wrapper: Swallow });
    spy.mockRestore();
    useGLTF.mockImplementation(() => ({ scene: {} }));
    clearFailedModels();
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith(expect.stringContaining('models/hd/cell.glb?v=1'));
    // Nothing left to clear the second time.
    clearFailedModels();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('does not treat a download in progress (a thrown promise) as a failure', async () => {
    const { useModel, clearFailedModels } = await import('./useModel');
    const clear = (useGLTF as unknown as { clear: ReturnType<typeof vi.fn> }).clear;
    const pending = Promise.resolve();
    useGLTF.mockImplementation(() => {
      throw pending;
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useModel(manifest, 'cell', 'single'), { wrapper: Swallow });
    spy.mockRestore();
    useGLTF.mockImplementation(() => ({ scene: {} }));
    clearFailedModels();
    expect(clear).not.toHaveBeenCalled();
  });
});
