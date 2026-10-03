import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import type { ReactNode } from 'react';
import { fakeCellGltf } from '../../test/fakeModel';
import { useAppStore } from '../../store/useAppStore';
import { SCENE2_OFFSET } from '../../lib/timeline';
import { CALCIUM, CRYSTALS, FLOW } from '../../lib/cascade';

const useModel = vi.fn();
vi.mock('../../assets/useModel', () => ({ useModel: (...args: unknown[]) => useModel(...args), preloadScene: vi.fn() }));
// drei's Html mounts real DOM next to the canvas, which the headless test renderer does not have.
vi.mock('@react-three/drei', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-three/drei')>();
  return { ...actual, Html: ({ children }: { children?: ReactNode }) => <>{children ? null : null}</> };
});

const { Scene2 } = await import('./Scene2');

// 3D smoke tests only (tech arch §9): mounting, counts, buffers react to progress.
beforeEach(() => useModel.mockReturnValue(fakeCellGltf()));
afterEach(() => {
  useModel.mockReset();
  useAppStore.setState({ globalProgress: 0, sceneProgress: 0 });
});

const names = (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => renderer.scene.children.map((c) => c.type);

describe('Scene2 (3D smoke test)', () => {
  it('is built around its own origin, placed so the source cloud sits at the world origin', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
    const group = renderer.scene.children[0].instance as unknown as { position: { toArray: () => number[] } };
    expect(group.position.toArray()).toEqual(SCENE2_OFFSET);
  });

  it('mounts three tubes of flow particles and the calcium pool (the source cloud is Scene 1\'s gathered burst)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
    const points = renderer.scene.findAll((n) => n.type === 'Points');
    // Three tubes, the calcium pool and, for Scene 5, the dialysis circuit.
    expect(points.length).toBe(5);
    expect(renderer.scene.findAll((n) => n.type === 'Mesh').length).toBeGreaterThan(3);
  });

  it('gives each stream its spec particle count', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
    const counts = renderer.scene
      .findAll((n) => n.type === 'Points')
      .map((p) => (p.props.geometry as { getAttribute: (n: string) => { count: number } }).getAttribute('position').count);
    expect(counts).toContain(FLOW.K.count);
    expect(counts).toContain(FLOW.PO4.count);
    expect(counts).toContain(FLOW.purines.count);
    expect(counts).toContain(CALCIUM.count);
  });

  it('asks for the crystals as instanced models and the props as single models', async () => {
    await ReactThreeTestRenderer.create(<Scene2 />);
    const calls = useModel.mock.calls.map((c) => [c[1], c[2]]);
    expect(calls).toContainEqual(['crystalCaPhos', 'instanced']);
    expect(calls).toContainEqual(['crystalUricAcid', 'instanced']);
    expect(calls).toContainEqual(['heartIcon', 'single']);
    expect(calls).toContainEqual(['kidney', 'single']);
    expect(calls).toContainEqual(['waypoint', 'single']);
    expect(calls).toContainEqual(['xoEnzyme', 'single']);
  });

  it('runs across the whole progress range without throwing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
    for (const p of [0, 0.1, 0.3, 0.45, 0.6, 0.8, 0.95, 1, 0.4, 0]) {
      useAppStore.setState({ globalProgress: 2 + p });
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(2, 16);
      });
    }
    expect(renderer.scene.children.length).toBeGreaterThan(0);
  });

  it('under reduced motion draws no flowing particles, only the pool', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene2 reducedMotion />);
    expect(renderer.scene.findAll((n) => n.type === 'Points')).toHaveLength(1);
    for (const p of [0.1, 0.5, 0.9]) {
      useAppStore.setState({ globalProgress: 2 + p });
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(2, 16);
      });
    }
  });

  it('keeps streams and the pool when a model fails to load', async () => {
    useModel.mockImplementation(() => {
      throw new Error('network down');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
    expect(renderer.scene.findAll((n) => n.type === 'Points').length).toBe(5);
    spy.mockRestore();
  });

  it('depletes the calcium pool as progress moves through step 2.2', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
    // The K⁺ stream also has 60 particles; the pool is the one carrying per-particle alpha (4-component colours).
    const pool = renderer.scene
      .findAll((n) => n.type === 'Points')
      .find((p) => (p.props.geometry as { getAttribute: (n: string) => { itemSize: number } }).getAttribute('color').itemSize === 4)!;
    const alpha = () => {
      const col = (pool.props.geometry as { getAttribute: (n: string) => { array: Float32Array } }).getAttribute('color').array;
      let visible = 0;
      for (let i = 0; i < CALCIUM.count; i++) visible += col[i * 4 + 3] > 0 ? 1 : 0;
      return visible;
    };
    const step = async (p: number) => {
      useAppStore.setState({ globalProgress: 2 + p });
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 16);
      });
    };
    await step(0.1);
    expect(alpha()).toBe(60);
    await step(0.6);
    expect(alpha()).toBe(60 - CALCIUM.consumed);
    await step(0.1);
    expect(alpha()).toBe(60); // replays in reverse
  });

  describe('Scene 5: the rewound cascade and its interventions', () => {
    type R = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
    // The eased effects are read by the streams on the frame after they are written, so run the frames in two batches.
    const settle = async (renderer: R, g: number) => {
      useAppStore.setState({ globalProgress: g });
      for (let i = 0; i < 2; i++) {
        await ReactThreeTestRenderer.act(async () => {
          await renderer.advanceFrames(20, 16);
        });
      }
    };
    const badgeGroups = (renderer: R) =>
      renderer.scene.findAll((n) => n.instance.name === 'intervention-badge');
    /** Total red-channel brightness of the purine stream's particles (the only stream with 120): a dissolve fades it. */
    const purine = (renderer: R) => {
      const stream = renderer.scene
        .findAll((n) => n.type === 'Points')
        .find((p) => (p.props.geometry as { getAttribute: (n: string) => { count: number } }).getAttribute('position').count === FLOW.purines.count)!;
      const col = (stream.props.geometry as { getAttribute: (n: string) => { array: Float32Array } }).getAttribute('color').array;
      let sum = 0;
      for (let i = 0; i < col.length; i += 3) sum += col[i];
      return { sum };
    };
    afterEach(() => useAppStore.setState({ interventionState: {}, scrub: null }));

    it('shows no badge in the rewind and all four in free play', async () => {
      const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
      await settle(renderer, 5.05);
      expect(badgeGroups(renderer)).toHaveLength(4);
      expect(badgeGroups(renderer).filter((b) => b.instance.visible)).toHaveLength(0);
      await settle(renderer, 5.9);
      expect(badgeGroups(renderer).filter((b) => b.instance.visible)).toHaveLength(4);
      await settle(renderer, 5.3);
      expect(badgeGroups(renderer).filter((b) => b.instance.visible)).toHaveLength(1);
    });

    it('keeps the streams idle at T+0h and flowing once the cascade has run', async () => {
      const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
      await settle(renderer, 5.05);
      expect(purine(renderer).sum).toBe(0);
      await settle(renderer, 5.9);
      expect(purine(renderer).sum).toBeGreaterThan(30);
    });

    it('rasburicase dims the purine stream where it acts, and the effect eases back out', async () => {
      const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
      await settle(renderer, 5.9);
      const untreated = purine(renderer).sum;
      useAppStore.setState({ interventionState: { rasburicase: true } });
      await settle(renderer, 5.9);
      expect(purine(renderer).sum).toBeLessThan(untreated * 0.98);
      useAppStore.setState({ interventionState: {} });
      await settle(renderer, 5.9);
      expect(purine(renderer).sum).toBeGreaterThan(untreated * 0.99);
    });

    it('a scrubbed time of zero idles the streams again', async () => {
      const renderer = await ReactThreeTestRenderer.create(<Scene2 />);
      await settle(renderer, 5.9);
      useAppStore.setState({ scrub: 0 });
      await settle(renderer, 5.9);
      expect(purine(renderer).sum).toBe(0);
    });
  });

  it('exposes crystal counts that match the spec ranges', () => {
    expect(CRYSTALS.caphos.count).toBeGreaterThanOrEqual(15);
    expect(CRYSTALS.uricacid.count).toBeLessThanOrEqual(15);
    void names;
  });
});
