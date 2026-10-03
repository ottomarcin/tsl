import { afterEach, describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { cameraPoseAt } from '../lib/timeline';
import { useAppStore } from '../store/useAppStore';

// The scenes themselves are covered by their own tests; here only the hand-over logic is under test.
vi.mock('../scenes/Tumor/TumorStage', () => ({ TumorStage: () => <group name="tumor" /> }));
vi.mock('../scenes/Scene2/Scene2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../scenes/Scene2/Scene2')>();
  return { ...actual, Scene2: () => <group name="cascade" /> };
});
vi.mock('../scenes/Scene3/Scene3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../scenes/Scene3/Scene3')>();
  return { ...actual, Scene3: () => <group name="nephron" /> };
});
vi.mock('./DevPlaceholderMesh', () => ({ DevPlaceholderMesh: () => <group name="placeholder" /> }));

const { Experience } = await import('./Experience');

afterEach(() => useAppStore.setState({ route: { kind: 'landing' }, globalProgress: 0, reducedMotion: false }));

import { useThree } from '@react-three/fiber';
import type { Camera } from 'three';

let camera: Camera | null = null;
function Probe() {
  camera = useThree((st) => st.camera);
  return null;
}
const mount = (props: { viewShift?: number } = {}) =>
  ReactThreeTestRenderer.create(
    <>
      <Probe />
      <Experience {...props} />
    </>,
  );
const names = (r: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => r.scene.children.map((c) => c.instance.name || 'anchor').filter((n) => n !== 'anchor' || true);
const setRoute = (index: number) => useAppStore.setState({ route: { kind: 'scene', index } });

describe('Experience: what is mounted', () => {
  it.each([
    [0, ['tumor']],
    [1, ['tumor', 'cascade']],
    [2, ['tumor', 'cascade', 'nephron']],
    [3, ['tumor', 'cascade', 'nephron']],
    [4, ['anchor']],
    [5, ['anchor']],
  ])('scene %i', async (index, expected) => {
    setRoute(index);
    const renderer = await mount();
    expect(names(renderer)).toEqual(expected);
  });

  it('mounts the cascade one scene early so its models are ready when the camera arrives', async () => {
    setRoute(1);
    expect(names(await mount())).toContain('cascade');
  });

  it('keeps the tumor stage mounted across the 0 → 1 → 2 boundaries (no remount, no swap)', async () => {
    setRoute(0);
    const renderer = await mount();
    const tumor = renderer.scene.children.find((c) => c.instance.name === 'tumor')!.instance;
    await ReactThreeTestRenderer.act(async () => setRoute(1));
    await ReactThreeTestRenderer.act(async () => setRoute(2));
    expect(renderer.scene.children.find((c) => c.instance.name === 'tumor')!.instance).toBe(tumor);
  });
});

describe('Experience: the camera', () => {
  const ctxFor = (aspect: number) => ({
    massDistance: Math.max(14, 6.2 / (Math.tan((25 * Math.PI) / 180) * Math.min(1, aspect))),
    cascadeDistance: Math.max(6.1 / Math.tan((25 * Math.PI) / 180), 7.2 / (Math.tan((25 * Math.PI) / 180) * aspect)),
    cascadeTargetY: -5.4,
    tubuleDistance: Math.max(3.8 / Math.tan((25 * Math.PI) / 180), 7.4 / (Math.tan((25 * Math.PI) / 180) * aspect)),
    keepFullFraming: aspect < 1.2,
  });

  it.each([0, 0.95, 1.5, 1.95, 2.05, 2.5])('sits on the camera path at g = %f', async (g) => {
    setRoute(Math.floor(g));
    useAppStore.setState({ globalProgress: g });
    const renderer = await mount();
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(2, 16);
    });
    const aspect = (camera as unknown as { aspect: number }).aspect;
    const expected = cameraPoseAt(g, ctxFor(aspect));
    expect(camera!.position.z).toBeCloseTo(expected.position[2], 3);
    expect(camera!.position.y).toBeCloseTo(expected.position[1], 3);
    expect((camera as unknown as { fov: number }).fov).toBeCloseTo(expected.fov, 3);
  });

  it('moves with the timeline from frame to frame', async () => {
    setRoute(1);
    useAppStore.setState({ globalProgress: 1.1 });
    const renderer = await mount();
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const before = camera!.position.z;
    useAppStore.setState({ globalProgress: 1.9 });
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect(camera!.position.z).toBeGreaterThan(before + 3);
  });

  it('under reduced motion cuts between per-step snapshots instead of following the scroll', async () => {
    setRoute(2);
    useAppStore.setState({ reducedMotion: true, globalProgress: 2.02 });
    const renderer = await mount();
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(2, 16);
    });
    // 2.02 is the first step of the cascade: its snapshot is well past the camera hand-over, so it is already on the cascade framing.
    expect(camera!.position.y).toBeCloseTo(-5.4, 3);
  });
});
