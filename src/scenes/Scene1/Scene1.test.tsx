import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeCellGltf } from '../../test/fakeModel';
import { BURST_AMOUNT_ATTRIBUTE } from '../../graphics/burstMaterial';
import { RupturingModelMass } from './RupturingModelMass';

const useModel = vi.fn();
vi.mock('../../assets/useModel', () => ({ useModel: (...args: unknown[]) => useModel(...args), preloadScene: vi.fn() }));
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Scene1 } from './Scene1';
import { RupturingMass } from './RupturingMass';
import { ParticleBurst } from '../../graphics/ParticleBurst';
import { Wavefront } from '../../graphics/Wavefront';
import { Ray, Vector3 } from 'three';
import { PARTICLES, WAVE, arrivalProgress, waveX } from '../../lib/cytolysis';
import { generateMassLayout } from '../../lib/massLayout';
import { useAppStore } from '../../store/useAppStore';
import { TUMOR_MASS_OPTIONS } from '../shared/tumorMass';

// 3D smoke tests only (tech arch §9): mounting, counts, buffers update when progress changes.
afterEach(() => {
  useAppStore.setState({ sceneProgress: 0 });
  useModel.mockReset();
});

describe('Scene1 (3D smoke test)', () => {
  it('mounts the mass, the wavefront and three particle systems', async () => {
    useModel.mockImplementation(() => {
      throw new Promise(() => {});
    });
    const renderer = await ReactThreeTestRenderer.create(<Scene1 />);
    const types = renderer.scene.children.map((c) => c.type);
    expect(types.filter((t) => t === 'Points')).toHaveLength(3);
    // The placeholder cells, the wavefront quad and its invisible grab strip all surface as 'Mesh'.
    expect(types.filter((t) => t === 'Mesh')).toHaveLength(3);
    const points = renderer.scene.children.find((c) => c.type === 'Points')!;
    const geo = points.props.geometry as { getAttribute: (n: string) => { count: number } };
    expect(geo.getAttribute('position').count).toBe(TUMOR_MASS_OPTIONS.count * PARTICLES.perCellPerSystem);
  });

  it('advances frames across the whole progress range, with and without reduced motion', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    for (const reducedMotion of [false, true]) {
      const renderer = await ReactThreeTestRenderer.create(<Scene1 reducedMotion={reducedMotion} />);
      for (const p of [0, 0.3, 0.55, 0.8, 1]) {
        useAppStore.setState({ sceneProgress: p });
        await ReactThreeTestRenderer.act(async () => {
          await renderer.advanceFrames(2, 16);
        });
      }
      expect(renderer.scene.children.length).toBeGreaterThan(0);
    }
  });
});

describe('RupturingMass', () => {
  const cells = generateMassLayout({ count: 6, sigma: 1, minSpacing: 0.5, seed: 2 });
  it('shrinks every cell to nothing once the event is over, and restores them when scrolled back', async () => {
    let progress = 0;
    const renderer = await ReactThreeTestRenderer.create(<RupturingMass instances={cells} waveCoords={cells.map((c) => c.position[0])} getProgress={() => progress} />);
    const mesh = renderer.scene.children[0].instance as unknown as { instanceMatrix: { array: Float32Array } };
    // Length of the first matrix column = the instance's x scale.
    const scaleOf = () => Math.hypot(mesh.instanceMatrix.array[0], mesh.instanceMatrix.array[1], mesh.instanceMatrix.array[2]);
    const intact = scaleOf();
    expect(intact).toBeGreaterThan(0.8);
    progress = 1;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect(scaleOf()).toBeCloseTo(0, 5);
    progress = 0;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect(scaleOf()).toBeCloseTo(intact, 5);
  });
});

describe('ParticleBurst', () => {
  it('only refills buffers when progress changes', async () => {
    let calls = 0;
    let progress = 0.1;
    const renderer = await ReactThreeTestRenderer.create(
      <ParticleBurst count={4} color="#ffffff" getProgress={() => progress} fill={() => { calls++; }} />,
    );
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(3, 16);
    });
    expect(calls).toBe(1);
    progress = 0.2;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(2, 16);
    });
    expect(calls).toBe(2);
  });
});

describe('Wavefront', () => {
  it('pushes the wave position and opacity into the shader uniforms each frame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Wavefront getX={() => 2.5} getOpacity={() => 0.75} />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const mat = (renderer.scene.children[0].instance as unknown as { material: { uniforms: Record<string, { value: number }> } }).material;
    expect(mat.uniforms.u_wave_x.value).toBe(2.5);
    expect(mat.uniforms.u_opacity.value).toBe(0.75);
  });
});

describe('Scene1 wavefront dragging', () => {
  const ray = (x: number) => new Ray(new Vector3(x, 0, 10), new Vector3(0, 0, -1));
  const ev = (x: number) => ({ ray: ray(x), pointerId: 1, stopPropagation: () => {}, target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() } });

  it('moves the scroll position to match the bar, and the bar follows the pointer exactly', async () => {
    useModel.mockImplementation(() => {
      throw new Promise(() => {});
    });
    const scrollToSceneProgress = vi.fn();
    useAppStore.setState({ scrollApi: { scrollToPage: vi.fn(), scrollToSceneProgress }, sceneProgress: 0.4 });
    const renderer = await ReactThreeTestRenderer.create(<Scene1 />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const hit = renderer.scene.children.filter((c) => c.type === 'Mesh').at(-1)!;
    const x0 = waveX(0.4);
    // Grab the bar 0.3 units ahead of its edge, then drag the pointer to x = 2.
    await renderer.fireEvent(hit, 'pointerDown', ev(x0 + 0.3));
    await renderer.fireEvent(hit, 'pointerMove', ev(2));
    // The bar keeps the 0.3 grab offset: its edge is at 2 - 0.3.
    expect(scrollToSceneProgress).toHaveBeenLastCalledWith(1, expect.closeTo(arrivalProgress(1.7), 6));
    const wave = renderer.scene.children.find((c) => c.type === 'Mesh' && (c.instance as unknown as { material: { uniforms?: unknown } }).material.uniforms)!;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const u = (wave.instance as unknown as { material: { uniforms: Record<string, { value: number }> } }).material.uniforms;
    expect(u.u_wave_x.value).toBeCloseTo(1.7, 4); // not the (stale, damped) store progress
    await renderer.fireEvent(hit, 'pointerUp', ev(2));
  });

  it('clamps the bar to the sweep range', async () => {
    useModel.mockImplementation(() => {
      throw new Promise(() => {});
    });
    const scrollToSceneProgress = vi.fn();
    useAppStore.setState({ scrollApi: { scrollToPage: vi.fn(), scrollToSceneProgress }, sceneProgress: 0.4 });
    const renderer = await ReactThreeTestRenderer.create(<Scene1 />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const hit = renderer.scene.children.filter((c) => c.type === 'Mesh').at(-1)!;
    await renderer.fireEvent(hit, 'pointerDown', ev(waveX(0.4)));
    await renderer.fireEvent(hit, 'pointerMove', ev(500));
    expect(scrollToSceneProgress).toHaveBeenLastCalledWith(1, WAVE.pEnd);
    await renderer.fireEvent(hit, 'pointerMove', ev(-500));
    expect(scrollToSceneProgress).toHaveBeenLastCalledWith(1, WAVE.pStart);
    await renderer.fireEvent(hit, 'pointerUp', ev(0));
  });
});

describe('RupturingModelMass', () => {
  const cells = generateMassLayout({ count: 6, sigma: 1, minSpacing: 0.5, seed: 2 });
  const burstAttr = (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => {
    const rig = renderer.scene.children[0].instance as unknown as { children: { name: string; geometry: { getAttribute: (n: string) => { array: Float32Array } } }[] };
    const membrane = rig.children.find((m) => m.name === 'membrane')!;
    return membrane.geometry.getAttribute(BURST_AMOUNT_ATTRIBUTE).array;
  };

  it('asks for the rupture model as an instanced model', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    await ReactThreeTestRenderer.create(<RupturingModelMass instances={cells} waveCoords={cells.map((c) => c.position[0])} getProgress={() => 0} />);
    expect(useModel).toHaveBeenCalledWith(expect.anything(), 'cellRupture', 'instanced');
  });

  it('keeps cells intact before the wave and drives rupture, shape keys and fade as progress advances', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    let progress = 0;
    const renderer = await ReactThreeTestRenderer.create(<RupturingModelMass instances={cells} waveCoords={cells.map((c) => c.position[0])} getProgress={() => progress} />);
    expect(Array.from(burstAttr(renderer))).toEqual(new Array(6).fill(0));
    const scaleOf = () => {
      const m = (renderer.scene.children[0].instance as unknown as { children: { instanceMatrix: { array: Float32Array } }[] }).children[0].instanceMatrix.array;
      return Math.hypot(m[0], m[1], m[2]);
    };
    const intact = scaleOf();
    progress = 1;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect(Array.from(burstAttr(renderer)).every((v) => v === 1)).toBe(true);
    expect(scaleOf()).toBeCloseTo(0, 5);
    progress = 0;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect(Array.from(burstAttr(renderer))).toEqual(new Array(6).fill(0));
    expect(scaleOf()).toBeCloseTo(intact, 5);
  });
});

describe('Wavefront dragging', () => {
  // Pointer ray straight down -z through world x, as the camera would cast it.
  const event = (x: number) => ({
    ray: new Ray(new Vector3(x, 0, 10), new Vector3(0, 0, -1)),
    pointerId: 1,
    stopPropagation: () => {},
    target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
  });

  async function mountDraggable(opacity = 1) {
    const handlers = { onDragStart: vi.fn(), onDrag: vi.fn(), onDragEnd: vi.fn() };
    const renderer = await ReactThreeTestRenderer.create(<Wavefront getX={() => 1} getOpacity={() => opacity} draggable {...handlers} />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    return { renderer, handlers, hit: renderer.scene.children[1] };
  }

  afterEach(() => {
    document.body.style.cursor = '';
  });

  it('has no grab strip unless draggable', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Wavefront getX={() => 0} getOpacity={() => 1} />);
    expect(renderer.scene.children).toHaveLength(1);
  });

  it('reports the pointer world x on grab, drag and release, and only while held', async () => {
    const { renderer, handlers, hit } = await mountDraggable();
    await renderer.fireEvent(hit, 'pointerMove', event(9));
    expect(handlers.onDrag).not.toHaveBeenCalled();
    await renderer.fireEvent(hit, 'pointerDown', event(2));
    expect(handlers.onDragStart).toHaveBeenCalledWith(expect.closeTo(2, 5));
    await renderer.fireEvent(hit, 'pointerMove', event(3.5));
    expect(handlers.onDrag).toHaveBeenLastCalledWith(expect.closeTo(3.5, 5));
    await renderer.fireEvent(hit, 'pointerUp', event(3.5));
    expect(handlers.onDragEnd).toHaveBeenCalledTimes(1);
    await renderer.fireEvent(hit, 'pointerMove', event(5));
    expect(handlers.onDrag).toHaveBeenCalledTimes(1);
  });

  it('captures the pointer on grab so the drag survives leaving the bar', async () => {
    const { renderer, hit } = await mountDraggable();
    const e = event(2);
    await renderer.fireEvent(hit, 'pointerDown', e);
    expect(e.target.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('shows grab / grabbing cursors and clears them afterwards', async () => {
    const { renderer, hit } = await mountDraggable();
    await renderer.fireEvent(hit, 'pointerOver', event(2));
    expect(document.body.style.cursor).toBe('grab');
    await renderer.fireEvent(hit, 'pointerDown', event(2));
    expect(document.body.style.cursor).toBe('grabbing');
    await renderer.fireEvent(hit, 'pointerUp', event(2));
    expect(document.body.style.cursor).toBe('grab');
    await renderer.fireEvent(hit, 'pointerOut', event(2));
    expect(document.body.style.cursor).toBe('');
  });

  it('ends the drag if the pointer capture is lost (e.g. the window loses focus)', async () => {
    const { renderer, handlers, hit } = await mountDraggable();
    await renderer.fireEvent(hit, 'pointerDown', event(2));
    await renderer.fireEvent(hit, 'lostPointerCapture', event(2));
    expect(handlers.onDragEnd).toHaveBeenCalledTimes(1);
    expect(document.body.style.cursor).toBe('');
  });

  it('cannot be grabbed once the bar has faded out', async () => {
    const { hit } = await mountDraggable(0);
    expect((hit.instance as { visible: boolean }).visible).toBe(false);
  });

  it('keeps the grab strip glued to the bar', async () => {
    const { hit } = await mountDraggable();
    expect((hit.instance as { position: { x: number } }).position.x).toBeCloseTo(1 - 0.35, 5);
  });
});
