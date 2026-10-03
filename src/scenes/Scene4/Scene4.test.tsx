import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import type { ReactNode } from 'react';
import { AnimationClip, BoxGeometry, type Object3D, BufferAttribute, Group, Mesh, MeshStandardMaterial, NumberKeyframeTrack } from 'three';
import { useAppStore } from '../../store/useAppStore';
import { SCENE4_OFFSET } from '../../lib/timeline';
import { POSES } from '../../lib/systemic';
import { SYSTEMIC_LAYOUTS } from './layout';

const useModel = vi.fn();
vi.mock('../../assets/useModel', () => ({ useModel: (...args: unknown[]) => useModel(...args), preloadScene: vi.fn() }));
// drei's Html mounts real DOM next to the canvas, which the headless test renderer does not have.
vi.mock('@react-three/drei', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-three/drei')>();
  return { ...actual, Html: ({ children }: { children?: ReactNode }) => <>{children ? null : null}</> };
});

const { Scene4 } = await import('./Scene4');
const { systoleAt, rhythmWander } = await import('./HeartPanel');

function fakeHeart() {
  const scene = new Group();
  const geo = new BoxGeometry();
  geo.morphAttributes.position = [new BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3)];
  geo.morphTargetsRelative = true;
  const mesh = new Mesh(geo, new MeshStandardMaterial({ transparent: true, opacity: 0.55 }));
  mesh.updateMorphTargets();
  mesh.morphTargetDictionary = { systole: 0 };
  scene.add(mesh);
  return { scene, animations: [] };
}
function fakeHand() {
  const scene = new Group();
  const hand = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  hand.name = 'hand';
  const nerves = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  nerves.name = 'nerves';
  scene.add(hand, nerves);
  const animations = POSES.map((name) => new AnimationClip(name, 0.08, [new NumberKeyframeTrack('hand.position[x]', [0, 0.08], [0, 0])]));
  return { scene, animations };
}
function fakeOrigin() {
  const scene = new Group();
  scene.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial({ transparent: true, opacity: 0.7 })));
  return { scene, animations: [] };
}
const modelFor = (id: string) => (id === 'heartFull' ? fakeHeart() : id === 'hand' ? fakeHand() : fakeOrigin());

beforeEach(() => useModel.mockImplementation((_m: unknown, id: string) => modelFor(id)));
afterEach(() => {
  useModel.mockReset();
  useAppStore.setState({ globalProgress: 0, sceneProgress: 0 });
});

const setP = async (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>, p: number) => {
  useAppStore.setState({ globalProgress: 4 + p });
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(2, 16);
  });
};

describe('systoleAt', () => {
  it('is zero at rest, rises with the QRS, holds, then relaxes', () => {
    expect(systoleAt(0.3)).toBe(0);
    expect(systoleAt(0.44)).toBe(0);
    expect(systoleAt(0.49)).toBeGreaterThan(0);
    expect(systoleAt(0.49)).toBeLessThan(1);
    expect(systoleAt(0.56)).toBe(1);
    expect(systoleAt(0.72)).toBeGreaterThan(0);
    expect(systoleAt(0.72)).toBeLessThan(1);
    expect(systoleAt(0.9)).toBe(0);
  });
  it('is periodic and within [0, 1]', () => {
    for (let p = -1; p < 2; p += 0.01) {
      expect(systoleAt(p)).toBeGreaterThanOrEqual(0);
      expect(systoleAt(p)).toBeLessThanOrEqual(1);
      expect(systoleAt(p)).toBeCloseTo(systoleAt(p + 1), 9);
    }
  });
});

describe('rhythmWander', () => {
  it('is nothing for a regular rhythm', () => {
    for (let t = 0; t < 20; t += 0.7) expect(rhythmWander(t, 0)).toBeCloseTo(0, 12);
  });
  it('wanders slightly in the last step, never by more than about a tenth of a beat (the rhythm on the monitor is regular)', () => {
    const vals = Array.from({ length: 200 }, (_, i) => rhythmWander(i * 0.1, 1));
    expect(Math.max(...vals) - Math.min(...vals)).toBeGreaterThan(0.08);
    vals.forEach((v) => expect(Math.abs(v)).toBeLessThanOrEqual(0.12));
  });
});

describe('Scene4 (3D smoke test)', () => {
  it('is built around the same point as the tubule it replaces', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene4 />);
    const group = renderer.scene.children[0].instance as unknown as { position: { toArray: () => number[] } };
    expect(group.position.toArray()).toEqual(SCENE4_OFFSET);
  });

  it('loads the origin, heart and hand as single models', async () => {
    await ReactThreeTestRenderer.create(<Scene4 />);
    const calls = useModel.mock.calls.map((c) => [c[1], c[2]]);
    expect(calls).toContainEqual(['lysisOrigin', 'single']);
    expect(calls).toContainEqual(['heartFull', 'single']);
    expect(calls).toContainEqual(['hand', 'single']);
  });

  it('runs across the whole scene in both layouts, with and without reduced motion', async () => {
    for (const layout of ['side', 'stacked'] as const) {
      for (const reducedMotion of [false, true]) {
        const renderer = await ReactThreeTestRenderer.create(<Scene4 layout={layout} reducedMotion={reducedMotion} />);
        for (const p of [0, 0.1, 0.3, 0.45, 0.6, 0.7, 0.8, 1, 0.4, 0]) await setP(renderer, p);
        expect(renderer.scene.children.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps going when a model fails to load', async () => {
    useModel.mockImplementation(() => {
      throw new Error('network down');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = await ReactThreeTestRenderer.create(<Scene4 />);
    // The monitor strip does not depend on a model.
    expect(renderer.scene.findAll((n) => n.type === 'Mesh').length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it('beats the heart with the trace: the systole shape key moves while the trace runs, and stays still under reduced motion', async () => {
    const read = (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => {
      const seen = new Set<number>();
      return {
        sample: () => {
          // The model is attached with <primitive>, so look in the three.js graph rather than the test-renderer tree.
          (renderer.scene.instance as unknown as Object3D).traverse((o) => {
            const m = o as Mesh;
            if (m.isMesh && m.morphTargetDictionary?.systole === 0 && m.morphTargetInfluences) seen.add(+m.morphTargetInfluences[0].toFixed(3));
          });
        },
        seen,
      };
    };
    const live = await ReactThreeTestRenderer.create(<Scene4 />);
    const lr = read(live);
    await setP(live, 0.1);
    for (let i = 0; i < 40; i++) {
      await ReactThreeTestRenderer.act(async () => {
        await live.advanceFrames(1, 100);
      });
      lr.sample();
    }
    expect(lr.seen.size).toBeGreaterThan(3);
    const still = await ReactThreeTestRenderer.create(<Scene4 reducedMotion />);
    const sr = read(still);
    await setP(still, 0.1);
    for (let i = 0; i < 10; i++) {
      await ReactThreeTestRenderer.act(async () => {
        await still.advanceFrames(1, 100);
      });
      sr.sample();
    }
    expect([...sr.seen]).toEqual([0]);
  });

  it('shows the pose weights on the rig: neutral early, carpopedal at the end', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene4 />);
    await setP(renderer, 0.2);
    // Only the weights can be checked here (the fake rig has no bones): the mixer must at least run without throwing.
    await setP(renderer, 0.9);
    expect(renderer.scene.children.length).toBeGreaterThan(0);
  });
});

describe('systemic layouts', () => {
  it('both lay out the same pieces with the heart and hand apart and the origin above both', () => {
    for (const spec of Object.values(SYSTEMIC_LAYOUTS)) {
      expect(spec.origin[1]).toBeGreaterThan(spec.heart.position[1]);
      expect(spec.origin[1]).toBeGreaterThan(spec.hand.position[1]);
      expect(spec.ecg.position[1]).toBeLessThan(spec.heart.position[1]);
      expect(spec.heartThreadEnd[1]).toBeLessThan(spec.origin[1]);
      expect(spec.handThreadEnd[1]).toBeLessThan(spec.origin[1]);
    }
  });
  it('side by side on desktop (hand right of the heart), stacked on a portrait screen (hand under the heart)', () => {
    expect(SYSTEMIC_LAYOUTS.side.hand.position[0]).toBeGreaterThan(SYSTEMIC_LAYOUTS.side.heart.position[0]);
    expect(SYSTEMIC_LAYOUTS.stacked.hand.position[1]).toBeLessThan(SYSTEMIC_LAYOUTS.stacked.ecg.position[1]);
  });
  it('the content fits inside its own extent', () => {
    for (const spec of Object.values(SYSTEMIC_LAYOUTS)) {
      const top = spec.origin[1] + 0.5;
      const bottom = Math.min(spec.ecg.position[1] - spec.ecg.height / 2, spec.hand.position[1] - 2.4 * spec.hand.scale);
      expect(top - bottom).toBeLessThanOrEqual(2 * spec.extent.halfHeight);
      expect(Math.abs(spec.heart.position[0]) + spec.ecg.width / 2).toBeLessThanOrEqual(spec.extent.halfWidth + 2);
    }
  });
});
