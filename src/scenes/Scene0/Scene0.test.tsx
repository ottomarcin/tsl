import { describe, expect, it } from 'vitest';
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

describe('Scene0 (3D smoke test)', () => {
  it('mounts the tumor mass at the spec instance count', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene0 />);
    const mesh = renderer.scene.children[0].children[0];
    expect((mesh.instance as { count: number }).count).toBe(TUMOR_MASS_OPTIONS.count);
  });
});
