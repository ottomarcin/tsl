import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import type { ReactNode } from 'react';
import { fakeCellGltf } from '../../test/fakeModel';
import { useAppStore } from '../../store/useAppStore';
import { FILTRATE } from '../../lib/renal';
import { SCENE3_OFFSET } from '../../lib/timeline';

const useModel = vi.fn();
vi.mock('../../assets/useModel', () => ({ useModel: (...args: unknown[]) => useModel(...args), preloadScene: vi.fn() }));
// drei's Html mounts real DOM next to the canvas, which the headless test renderer does not have.
vi.mock('@react-three/drei', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-three/drei')>();
  return { ...actual, Html: ({ children }: { children?: ReactNode }) => <>{children ? null : null}</> };
});

const { Scene3, SCENE3_ID } = await import('./Scene3');

// 3D smoke tests only (tech arch §9): mounting, counts, uniforms and buffers react to progress and the chosen mechanism.
beforeEach(() => useModel.mockReturnValue(fakeCellGltf()));
afterEach(() => {
  useModel.mockReset();
  useAppStore.setState({ globalProgress: 0, sceneProgress: 0, modeSelection: {} });
});

const setP = async (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>, p: number) => {
  useAppStore.setState({ globalProgress: 3 + p });
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(2, 16);
  });
};

describe('Scene3 (3D smoke test)', () => {
  it('is placed well below the cascade, which the camera flies down to', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene3 />);
    const group = renderer.scene.children[0].instance as unknown as { position: { toArray: () => number[] } };
    expect(group.position.toArray()).toEqual(SCENE3_OFFSET);
  });

  it('draws the filtrate with the spec particle count', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene3 />);
    const counts = renderer.scene
      .findAll((n) => n.type === 'Points')
      .map((p) => (p.props.geometry as { getAttribute: (n: string) => { count: number } }).getAttribute('position').count);
    expect(counts).toContain(FILTRATE.count);
  });

  it('loads the nephron, vessels and arrow as single models and the crystals as instanced ones', async () => {
    await ReactThreeTestRenderer.create(<Scene3 />);
    const calls = useModel.mock.calls.map((c) => [c[1], c[2]]);
    expect(calls).toContainEqual(['nephron', 'single']);
    expect(calls).toContainEqual(['capillaries', 'single']);
    expect(calls).toContainEqual(['feedbackArrow', 'single']);
    expect(calls).toContainEqual(['crystalCaPhos', 'instanced']);
    expect(calls).toContainEqual(['crystalUricAcid', 'instanced']);
  });

  it('runs across the whole scene with each mechanism, with and without reduced motion', async () => {
    for (const reducedMotion of [false, true]) {
      const renderer = await ReactThreeTestRenderer.create(<Scene3 reducedMotion={reducedMotion} />);
      for (const mode of ['obstruction', 'cytotoxicity', 'vasoconstriction', 'histone']) {
        useAppStore.getState().setMode(SCENE3_ID, mode);
        for (const p of [0, 0.2, 0.45, 0.6, 0.8, 1, 0.3]) await setP(renderer, p);
      }
      expect(renderer.scene.children.length).toBeGreaterThan(0);
    }
  });

  it('keeps going when a model fails to load', async () => {
    useModel.mockImplementation(() => {
      throw new Error('network down');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = await ReactThreeTestRenderer.create(<Scene3 />);
    expect(renderer.scene.findAll((n) => n.type === 'Points').length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it('only shows the chosen overlay from step 3.3, and only that one', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene3 />);
    // The histone wisps are the 4-component-colour points system with 40 particles.
    const wisps = renderer.scene.findAll((n) => n.type === 'Points').find((p) => (p.props.geometry as { getAttribute: (n: string) => { count: number } }).getAttribute('position').count === 40)!;
    const alpha = () => {
      const col = (wisps.props.geometry as { getAttribute: (n: string) => { array: Float32Array } }).getAttribute('color').array;
      let max = 0;
      for (let i = 3; i < col.length; i += 4) max = Math.max(max, col[i]);
      return max;
    };
    useAppStore.getState().setMode(SCENE3_ID, 'histone');
    await setP(renderer, 0.3);
    expect(alpha()).toBe(0); // chosen, but step 3.3 has not started
    await setP(renderer, 0.7);
    expect(alpha()).toBeGreaterThan(0.05);
    useAppStore.getState().setMode(SCENE3_ID, 'obstruction');
    await setP(renderer, 0.7);
    expect(alpha()).toBe(0);
  });
});
