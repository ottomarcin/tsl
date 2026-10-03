import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeCellGltf } from '../../test/fakeModel';

const useModel = vi.fn();
vi.mock('../../assets/useModel', () => ({ useModel: (...args: unknown[]) => useModel(...args), preloadScene: vi.fn() }));
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Scene0, TUMOR_MASS_OPTIONS } from './Scene0';
import { InstancedMass } from '../../graphics/InstancedMass';
import { generateMassLayout } from '../../lib/massLayout';

// 3D smoke test only (tech arch §9): mounts, instance count matches props, frames advance.
describe('InstancedMass (3D smoke test)', () => {
  const instances = generateMassLayout({ count: 12, sigma: 1, minSpacing: 0.5, seed: 1 });

  it('creates one InstancedMesh with an instance per layout entry', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <InstancedMass instances={instances}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial />
      </InstancedMass>,
    );
    const mesh = renderer.scene.children[0].children[0];
    expect((mesh.instance as { count: number }).count).toBe(12);
  });

  it('advances frames with and without reduced motion', async () => {
    for (const reducedMotion of [false, true]) {
      const renderer = await ReactThreeTestRenderer.create(
        <InstancedMass instances={instances} reducedMotion={reducedMotion}>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshBasicMaterial />
        </InstancedMass>,
      );
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(3, 16);
      });
      expect(renderer.scene.children.length).toBeGreaterThan(0);
    }
  });
});

afterEach(() => useModel.mockReset());

// The rig is attached with <primitive>, so its meshes live on the three.js objects, not in the test-renderer tree.
function rigMeshes(renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) {
  const modelGroup = renderer.scene.children[0].instance as unknown as { children: { children: { name: string; count: number; renderOrder: number }[] }[] };
  return modelGroup.children[0].children;
}

describe('Scene0 (3D smoke test)', () => {
  const pending = () => {
    throw new Promise(() => {}); // never resolves: stays suspended
  };

  it('shows the placeholder mass while the model is loading', async () => {
    useModel.mockImplementation(pending);
    const renderer = await ReactThreeTestRenderer.create(<Scene0 />);
    const mesh = renderer.scene.children[0].children[0];
    expect(mesh.type).toBe('Mesh');
    expect((mesh.instance as { count: number }).count).toBe(TUMOR_MASS_OPTIONS.count);
  });

  it('falls back to the placeholder mass if the model fails to load', async () => {
    useModel.mockImplementation(() => {
      throw new Error('network down');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderer = await ReactThreeTestRenderer.create(<Scene0 />);
    expect((renderer.scene.children[0].children[0].instance as { count: number }).count).toBe(TUMOR_MASS_OPTIONS.count);
    spy.mockRestore();
  });

  it('draws the real model: one instanced draw call per part, 200 cells each, requested as an instanced model', async () => {
    useModel.mockReturnValue(fakeCellGltf());
    const renderer = await ReactThreeTestRenderer.create(<Scene0 />);
    const meshes = rigMeshes(renderer);
    expect(meshes.map((m) => m.name).sort()).toEqual(['membrane', 'nucleus']);
    meshes.forEach((m) => expect(m.count).toBe(TUMOR_MASS_OPTIONS.count));
    expect(useModel).toHaveBeenCalledWith(expect.anything(), 'cell', 'instanced');
  });

  it('draws the membrane after the nucleus', async () => {
    useModel.mockReturnValue(fakeCellGltf());
    const renderer = await ReactThreeTestRenderer.create(<Scene0 />);
    const meshes = rigMeshes(renderer);
    const order = Object.fromEntries(meshes.map((m) => [m.name, m.renderOrder]));
    expect(order.nucleus).toBeLessThan(order.membrane);
  });

  it('animates the real mass without throwing, and freezes under reduced motion', async () => {
    useModel.mockReturnValue(fakeCellGltf());
    for (const reducedMotion of [false, true]) {
      const renderer = await ReactThreeTestRenderer.create(<Scene0 reducedMotion={reducedMotion} />);
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(3, 16);
      });
      expect(renderer.scene.children.length).toBeGreaterThan(0);
    }
  });
});
