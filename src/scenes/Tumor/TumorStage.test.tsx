import { afterEach, describe, expect, it, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Ray, Raycaster, Vector3, type Object3D } from 'three';
import { fakeCellGltf } from '../../test/fakeModel';
import { BURST_AMOUNT_ATTRIBUTE } from '../../graphics/burstMaterial';
import { ParticleBurst } from '../../graphics/ParticleBurst';
import { Wavefront } from '../../graphics/Wavefront';
import { PARTICLES, WAVE, arrivalProgress, waveX } from '../../lib/cytolysis';
import { generateMassLayout } from '../../lib/massLayout';
import { idleSway, massRotation } from '../../lib/timeline';
import { useAppStore } from '../../store/useAppStore';
import { TUMOR_MASS_OPTIONS } from '../shared/tumorMass';
import { CellMass } from './CellMass';
import { PlaceholderCells } from './PlaceholderCells';
import { TumorStage } from './TumorStage';

const useModel = vi.fn();
vi.mock('../../assets/useModel', () => ({ useModel: (...args: unknown[]) => useModel(...args), preloadScene: vi.fn() }));

// 3D smoke tests only (tech arch §9): mounting, counts, buffers and transforms follow the global timeline.
afterEach(() => {
  useAppStore.setState({ globalProgress: 0, sceneProgress: 0 });
  useModel.mockReset();
});

const setG = async (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>, g: number) => {
  useAppStore.setState({ globalProgress: g });
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(2, 16);
  });
};
const pending = () => {
  throw new Promise(() => {});
};

describe('TumorStage (3D smoke test)', () => {
  it('mounts the cells, the wavefront with its grab strip, and three particle systems', async () => {
    useModel.mockImplementation(pending);
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    const types = renderer.scene.children.map((c) => c.type);
    expect(types.filter((t) => t === 'Points')).toHaveLength(3);
    // Wavefront quad + invisible grab strip.
    expect(types.filter((t) => t === 'Mesh')).toHaveLength(2);
    const points = renderer.scene.children.find((c) => c.type === 'Points')!;
    const geo = points.props.geometry as { getAttribute: (n: string) => { count: number } };
    expect(geo.getAttribute('position').count).toBe(TUMOR_MASS_OPTIONS.count * PARTICLES.perCellPerSystem);
  });

  it('draws the rupture model for the whole of Scenes 0 and 1 (nothing swaps at the boundary)', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    await ReactThreeTestRenderer.create(<TumorStage />);
    expect(useModel.mock.calls.every((c) => c[1] === 'cellRupture' && c[2] === 'instanced')).toBe(true);
    expect(useModel).toHaveBeenCalled();
  });

  it('turns the mass with the scroll, holds it still through Scene 1, and sways only inside Scene 0', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    const spin = renderer.scene.children[0].instance as unknown as { rotation: { y: number } };
    await setG(renderer, 0.5);
    expect(spin.rotation.y).toBeGreaterThan(massRotation(0));
    expect(Math.abs(spin.rotation.y - massRotation(0.5))).toBeLessThanOrEqual(0.121);
    await setG(renderer, 1);
    const at1 = spin.rotation.y;
    expect(at1).toBeCloseTo(massRotation(1), 6);
    await setG(renderer, 1.6);
    expect(spin.rotation.y).toBeCloseTo(at1, 9); // no step at the boundary
    expect(Math.abs(idleSway(1.6, 99))).toBe(0);
  });

  it('keeps every particle dark and unchanged before the wave, and does not rewrite the buffers while scrolling Scene 0', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    const points = renderer.scene.children.find((c) => c.type === 'Points')!;
    const col = (points.props.geometry as { getAttribute: (n: string) => { array: Float32Array; version: number } }).getAttribute('color');
    await setG(renderer, 0.2);
    const version = col.version;
    expect(Math.max(...col.array)).toBe(0);
    await setG(renderer, 0.6);
    expect(col.version).toBe(version);
  });

  it('gathers the burst into the cascade source cloud, and leaves about 210 survivors lit', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    const systems = renderer.scene.children.filter((c) => c.type === 'Points');
    const lit = () =>
      systems.reduce((sum, p) => {
        const col = (p.props.geometry as { getAttribute: (n: string) => { array: Float32Array } }).getAttribute('color').array;
        let n = 0;
        for (let i = 0; i < col.length; i += 3) n += col[i] + col[i + 1] + col[i + 2] > 0.05 ? 1 : 0;
        return sum + n;
      }, 0);
    await setG(renderer, 1.7);
    const during = lit();
    expect(during).toBeGreaterThan(300);
    await setG(renderer, 2.3);
    const after = lit();
    const expected = 3 * Math.ceil((TUMOR_MASS_OPTIONS.count * PARTICLES.perCellPerSystem) / 86);
    expect(after).toBe(expected);
    expect(after).toBeGreaterThanOrEqual(200);
    expect(after).toBeLessThanOrEqual(220);
  });

  it('runs across the whole range with and without reduced motion, and falls back to placeholder cells on error', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    for (const reducedMotion of [false, true]) {
      const renderer = await ReactThreeTestRenderer.create(<TumorStage reducedMotion={reducedMotion} />);
      for (const g of [0, 0.5, 1, 1.4, 1.8, 2, 2.1, 2.6, 1.2, 0]) await setG(renderer, g);
      expect(renderer.scene.children.length).toBeGreaterThan(0);
    }
    useModel.mockImplementation(() => {
      throw new Error('network down');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    expect(renderer.scene.children.filter((c) => c.type === 'Points')).toHaveLength(3);
    spy.mockRestore();
  });
});

describe('PlaceholderCells', () => {
  const cells = generateMassLayout({ count: 6, sigma: 1, minSpacing: 0.5, seed: 2 });
  it('shrinks every cell to nothing once the event is over, and restores them when scrolled back', async () => {
    let progress = 0;
    const renderer = await ReactThreeTestRenderer.create(<PlaceholderCells instances={cells} waveCoords={cells.map((c) => c.position[0])} getLocal={() => progress} />);
    const mesh = renderer.scene.children[0].instance as unknown as { instanceMatrix: { array: Float32Array } };
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

  it('ends a drag when the pointer moves with no button held (a release that never arrived), without moving the story', async () => {
    const { renderer, handlers, hit } = await mountDraggable();
    await renderer.fireEvent(hit, 'pointerDown', { ...event(2), buttons: 1 });
    await renderer.fireEvent(hit, 'pointerMove', { ...event(3), buttons: 1 });
    expect(handlers.onDrag).toHaveBeenCalledTimes(1);
    await renderer.fireEvent(hit, 'pointerMove', { ...event(4), buttons: 0 });
    expect(handlers.onDragEnd).toHaveBeenCalledTimes(1);
    expect(handlers.onDrag).toHaveBeenCalledTimes(1);
    await renderer.fireEvent(hit, 'pointerMove', { ...event(5), buttons: 0 });
    expect(handlers.onDrag).toHaveBeenCalledTimes(1);
    expect(handlers.onDragEnd).toHaveBeenCalledTimes(1);
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

  it('cannot be grabbed once the bar has faded out: not visible, and not hit by the pointer ray either', async () => {
    const { renderer, hit, handlers } = await mountDraggable(0);
    expect((hit.instance as { visible: boolean }).visible).toBe(false);
    // three's raycaster ignores `visible`, so the strip must opt out of raycasting itself.
    const strip = hit.instance as unknown as Object3D;
    strip.updateMatrixWorld(true);
    const raycaster = new Raycaster(new Vector3(strip.position.x, 0, 10), new Vector3(0, 0, -1));
    expect(raycaster.intersectObject(strip)).toHaveLength(0);
    void renderer;
    void handlers;
  });

  it('is hit by the pointer ray while the bar is visible', async () => {
    const { hit } = await mountDraggable(1);
    const strip = hit.instance as unknown as Object3D;
    strip.updateMatrixWorld(true);
    const raycaster = new Raycaster(new Vector3(strip.position.x, 0, 10), new Vector3(0, 0, -1));
    expect(raycaster.intersectObject(strip).length).toBeGreaterThan(0);
  });

  it('becomes grabbable again when the bar returns, and drops an in-progress drag if it fades away', async () => {
    let opacity = 1;
    const handlers = { onDragStart: vi.fn(), onDrag: vi.fn(), onDragEnd: vi.fn() };
    const renderer = await ReactThreeTestRenderer.create(<Wavefront getX={() => 1} getOpacity={() => opacity} draggable {...handlers} />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const hit = renderer.scene.children[1];
    await renderer.fireEvent(hit, 'pointerOver', event(1));
    await renderer.fireEvent(hit, 'pointerDown', event(1));
    expect(document.body.style.cursor).toBe('grabbing');
    opacity = 0;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect(handlers.onDragEnd).toHaveBeenCalledTimes(1);
    expect(document.body.style.cursor).toBe('');
    opacity = 1;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    expect((hit.instance as { visible: boolean }).visible).toBe(true);
  });

  it('keeps the grab strip glued to the bar', async () => {
    const { hit } = await mountDraggable();
    expect((hit.instance as { position: { x: number } }).position.x).toBeCloseTo(1 - 0.35, 5);
  });
});

describe('TumorStage wavefront dragging', () => {
  const ev = (x: number) => ({
    ray: new Ray(new Vector3(x, 0, 10), new Vector3(0, 0, -1)),
    pointerId: 1,
    stopPropagation: () => {},
    target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
  });
  const start = async () => {
    useModel.mockImplementation(pending);
    const scrollToSceneProgress = vi.fn();
    useAppStore.setState({ scrollApi: { scrollToPage: vi.fn(), scrollBy: vi.fn(), scrollToSceneProgress }, globalProgress: 1.4 });
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const hit = renderer.scene.children.filter((c) => c.type === 'Mesh').at(-1)!;
    return { renderer, hit, scrollToSceneProgress };
  };

  it('moves the scroll position to match the bar, keeping the grab offset, and the bar follows the pointer exactly', async () => {
    const { renderer, hit, scrollToSceneProgress } = await start();
    const x0 = waveX(0.4);
    await renderer.fireEvent(hit, 'pointerDown', ev(x0 + 0.3));
    await renderer.fireEvent(hit, 'pointerMove', ev(2));
    expect(scrollToSceneProgress).toHaveBeenLastCalledWith(1, expect.closeTo(arrivalProgress(1.7), 6));
    const wave = renderer.scene.children.find((c) => c.type === 'Mesh' && (c.instance as unknown as { material: { uniforms?: unknown } }).material.uniforms)!;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 16);
    });
    const u = (wave.instance as unknown as { material: { uniforms: Record<string, { value: number }> } }).material.uniforms;
    expect(u.u_wave_x.value).toBeCloseTo(1.7, 4); // not the (stale, damped) store progress
    await renderer.fireEvent(hit, 'pointerUp', ev(2));
  });

  it('does not keep a dragged value once the story is elsewhere: the bar is gone and cannot be grabbed in Scene 4', async () => {
    const { renderer, hit, scrollToSceneProgress } = await start();
    await renderer.fireEvent(hit, 'pointerDown', ev(waveX(0.4)));
    await renderer.fireEvent(hit, 'pointerMove', ev(1));
    // The pointer is never released; the visitor jumps to Scene 4 with the menu.
    await setG(renderer, 4.2);
    const wave = renderer.scene.children.find((c) => c.type === 'Mesh' && (c.instance as unknown as { material: { uniforms?: unknown } }).material.uniforms)!;
    const u = (wave.instance as unknown as { material: { uniforms: Record<string, { value: number }> } }).material.uniforms;
    expect(u.u_opacity.value).toBe(0);
    expect((hit.instance as unknown as { visible: boolean }).visible).toBe(false);
    // And hovering where it was does not take the story back.
    scrollToSceneProgress.mockClear();
    await renderer.fireEvent(hit, 'pointerMove', { ...ev(0), buttons: 0 });
    await renderer.fireEvent(hit, 'pointerMove', ev(0));
    expect(scrollToSceneProgress).not.toHaveBeenCalled();
  });

  it('clamps the bar to the sweep range', async () => {
    const { renderer, hit, scrollToSceneProgress } = await start();
    await renderer.fireEvent(hit, 'pointerDown', ev(waveX(0.4)));
    await renderer.fireEvent(hit, 'pointerMove', ev(500));
    expect(scrollToSceneProgress).toHaveBeenLastCalledWith(1, WAVE.pEnd);
    await renderer.fireEvent(hit, 'pointerMove', ev(-500));
    expect(scrollToSceneProgress).toHaveBeenLastCalledWith(1, WAVE.pStart);
    await renderer.fireEvent(hit, 'pointerUp', ev(0));
  });
});

describe('CellMass', () => {
  const cells = generateMassLayout({ count: 6, sigma: 1, minSpacing: 0.5, seed: 2 });
  const coords = cells.map((c) => c.position[0]);
  const burstAttr = (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => {
    const rig = renderer.scene.children[0].instance as unknown as { children: { name: string; geometry: { getAttribute: (n: string) => { array: Float32Array } } }[] };
    const membrane = rig.children.find((m) => m.name === 'membrane')!;
    return membrane.geometry.getAttribute(BURST_AMOUNT_ATTRIBUTE).array;
  };

  it('asks for the rupture model as an instanced model', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    await ReactThreeTestRenderer.create(<CellMass instances={cells} waveCoords={coords} getLocal={() => 0} reducedMotion={false} />);
    expect(useModel).toHaveBeenCalledWith(expect.anything(), 'cellRupture', 'instanced');
  });

  it('keeps cells intact before the wave and drives rupture, shape keys and fade as progress advances', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    let progress = 0;
    const renderer = await ReactThreeTestRenderer.create(<CellMass instances={cells} waveCoords={coords} getLocal={() => progress} reducedMotion />);
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

  it('breathes while intact, and holds still under reduced motion', async () => {
    useModel.mockReturnValue(fakeCellGltf({ rupture: true }));
    const read = (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => {
      const m = (renderer.scene.children[0].instance as unknown as { children: { instanceMatrix: { array: Float32Array } }[] }).children[0].instanceMatrix.array;
      return Math.hypot(m[0], m[1], m[2]);
    };
    const moving = await ReactThreeTestRenderer.create(<CellMass instances={cells} waveCoords={coords} getLocal={() => 0} reducedMotion={false} />);
    const a = read(moving);
    await ReactThreeTestRenderer.act(async () => {
      await moving.advanceFrames(40, 100);
    });
    expect(read(moving)).not.toBeCloseTo(a, 6);
    const still = await ReactThreeTestRenderer.create(<CellMass instances={cells} waveCoords={coords} getLocal={() => 0} reducedMotion />);
    const b = read(still);
    await ReactThreeTestRenderer.act(async () => {
      await still.advanceFrames(40, 100);
    });
    expect(read(still)).toBeCloseTo(b, 9);
  });
});

describe('TumorStage: the wavefront is only a control while the wave is on screen', () => {
  const mount = async () => {
    useModel.mockImplementation(pending);
    const scrollToSceneProgress = vi.fn();
    useAppStore.setState({ scrollApi: { scrollToPage: vi.fn(), scrollBy: vi.fn(), scrollToSceneProgress }, globalProgress: 0 });
    const renderer = await ReactThreeTestRenderer.create(<TumorStage />);
    return { renderer, scrollToSceneProgress, hit: renderer.scene.children.filter((c) => c.type === 'Mesh').at(-1)! };
  };
  /** Casts a straight-down ray at the strip's current x, after bringing its world matrix up to date (the test renderer has no render pass to do it). */
  const hits = (hit: { instance: unknown }) => {
    const strip = hit.instance as Object3D;
    strip.updateMatrixWorld(true);
    return new Raycaster(new Vector3(strip.position.x, 0, 10), new Vector3(0, 0, -1)).intersectObject(strip).length;
  };

  it.each([
    ['Scene 0 (the strip waits at the far left)', 0.5],
    ['the end of Scene 1, after the wave', 1.95],
    ['Scene 2', 2.5],
    ['Scene 3 (the strip waits at the far right)', 3.5],
  ])('a click on the strip\'s resting place does not scrub the story: %s', async (_name, g) => {
    const { renderer, scrollToSceneProgress, hit } = await mount();
    useAppStore.setState({ globalProgress: g });
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(2, 16);
    });
    expect(hits(hit)).toBe(0);
    expect(scrollToSceneProgress).not.toHaveBeenCalled();
  });

  it('is grabbable while the wave sweeps (Scene 1, mid-wave)', async () => {
    const { renderer, hit } = await mount();
    useAppStore.setState({ globalProgress: 1.4 });
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(2, 16);
    });
    expect(hits(hit)).toBeGreaterThan(0);
  });
});
