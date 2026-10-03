import { afterEach, describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Scene1 } from './Scene1';
import { RupturingMass } from './RupturingMass';
import { ParticleBurst } from '../../graphics/ParticleBurst';
import { Wavefront } from '../../graphics/Wavefront';
import { PARTICLES } from '../../lib/cytolysis';
import { generateMassLayout } from '../../lib/massLayout';
import { useAppStore } from '../../store/useAppStore';
import { TUMOR_MASS_OPTIONS } from '../shared/tumorMass';

// 3D smoke tests only (tech arch §9): mounting, counts, buffers update when progress changes.
afterEach(() => useAppStore.setState({ sceneProgress: 0 }));

describe('Scene1 (3D smoke test)', () => {
  it('mounts the mass, the wavefront and three particle systems', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene1 />);
    const types = renderer.scene.children.map((c) => c.type);
    expect(types.filter((t) => t === 'Points')).toHaveLength(3);
    // The instanced cells and the wavefront quad both surface as 'Mesh'.
    expect(types.filter((t) => t === 'Mesh')).toHaveLength(2);
    const points = renderer.scene.children.find((c) => c.type === 'Points')!;
    const geo = points.props.geometry as { getAttribute: (n: string) => { count: number } };
    expect(geo.getAttribute('position').count).toBe(TUMOR_MASS_OPTIONS.count * PARTICLES.perCellPerSystem);
  });

  it('advances frames across the whole progress range, with and without reduced motion', async () => {
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
    const renderer = await ReactThreeTestRenderer.create(<RupturingMass instances={cells} getProgress={() => progress} />);
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
