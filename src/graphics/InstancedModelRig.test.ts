import { describe, expect, it } from 'vitest';
import { BoxGeometry, BufferAttribute, Color, Matrix4, MeshStandardMaterial } from 'three';
import type { ModelPart } from '../assets/collectMeshes';
import { InstancedModelRig } from './InstancedModelRig';
import { BURST_AMOUNT_ATTRIBUTE, BURST_MASK_ATTRIBUTE } from './burstMaterial';

function part(name: string, opts: { transparent?: boolean; morph?: string[]; burst?: boolean; emissive?: number } = {}): ModelPart {
  const geometry = new BoxGeometry();
  const n = geometry.attributes.position.count;
  if (opts.morph?.length) {
    geometry.morphAttributes.position = opts.morph.map(() => new BufferAttribute(new Float32Array(n * 3), 3));
    geometry.morphTargetsRelative = true;
  }
  if (opts.burst) geometry.setAttribute('_burst', new BufferAttribute(new Float32Array(n), 1));
  const material = new MeshStandardMaterial({ transparent: opts.transparent ?? false, opacity: opts.transparent ? 0.5 : 1 });
  if (opts.emissive) material.emissive = new Color(opts.emissive, 0, 0);
  return { name, geometry, material, morphTargetNames: opts.morph ?? [], customAttributes: opts.burst ? ['_burst'] : [] };
}

describe('InstancedModelRig', () => {
  it('makes one InstancedMesh (one draw call) per part, each with the full instance count', () => {
    const rig = new InstancedModelRig([part('nucleus'), part('membrane')], 25);
    expect(rig.meshes).toHaveLength(2);
    expect(rig.meshes.every((m) => m.count === 25)).toBe(true);
    expect(rig.group.children).toHaveLength(2);
  });

  it('shares one matrix and one colour buffer across parts, so a write reaches every part', () => {
    const rig = new InstancedModelRig([part('a'), part('b')], 3);
    expect(rig.meshes[0].instanceMatrix).toBe(rig.meshes[1].instanceMatrix);
    expect(rig.meshes[0].instanceColor).toBe(rig.meshes[1].instanceColor);
    rig.setMatrixAt(1, new Matrix4().makeTranslation(4, 5, 6));
    const arr = rig.meshes[1].instanceMatrix.array;
    expect([arr[16 + 12], arr[16 + 13], arr[16 + 14]]).toEqual([4, 5, 6]);
    rig.setColorAt(2, new Color(0.25, 0.5, 0.75));
    expect(Array.from(rig.meshes[0].instanceColor!.array.slice(6, 9))).toEqual([0.25, 0.5, 0.75]);
  });

  it('starts with identity matrices, never zeroed instances', () => {
    const rig = new InstancedModelRig([part('a')], 2);
    const arr = rig.meshes[0].instanceMatrix.array;
    expect([arr[0], arr[5], arr[10], arr[15]]).toEqual([1, 1, 1, 1]);
  });

  it('orders nested translucent parts inside-out by name prefix, unlisted parts first', () => {
    const rig = new InstancedModelRig([part('membrane_lod1'), part('nucleus_lod1'), part('rest')], 1, { drawOrder: ['nucleus', 'membrane'] });
    const order = Object.fromEntries(rig.meshes.map((m) => [m.name, m.renderOrder]));
    expect(order.rest).toBe(0);
    expect(order.nucleus_lod1).toBeLessThan(order.membrane_lod1);
    expect(order.nucleus_lod1).toBeGreaterThan(order.rest);
  });

  it('stops translucent shells from writing depth, and leaves opaque parts alone', () => {
    const rig = new InstancedModelRig([part('shell', { transparent: true }), part('core')], 1);
    const [shell, core] = rig.meshes.map((m) => m.material as MeshStandardMaterial);
    expect(shell.depthWrite).toBe(false);
    expect(shell.forceSinglePass).toBe(true);
    expect(core.depthWrite).toBe(true);
  });

  it('never mutates the cached model: geometry and materials are clones', () => {
    const p = part('a', { transparent: true });
    const rig = new InstancedModelRig([p], 1);
    expect(rig.meshes[0].geometry).not.toBe(p.geometry);
    expect(rig.meshes[0].material).not.toBe(p.material);
    expect((p.material as MeshStandardMaterial).depthWrite).toBe(true);
  });

  it('lifts faint emissive materials to the spec self-luminance and leaves bright or absent ones', () => {
    const rig = new InstancedModelRig([part('faint', { emissive: 0.001 }), part('none'), part('bright', { emissive: 0.5 })], 1);
    const [faint, none, bright] = rig.meshes.map((m) => m.material as MeshStandardMaterial);
    expect(Math.max(faint.emissive.r, faint.emissive.g, faint.emissive.b) * faint.emissiveIntensity).toBeCloseTo(0.05, 3);
    expect(none.emissiveIntensity).toBe(1);
    expect(bright.emissiveIntensity).toBe(1);
  });

  it('can switch the emissive lift off', () => {
    const rig = new InstancedModelRig([part('faint', { emissive: 0.001 })], 1, { selfLuminance: 0 });
    expect((rig.meshes[0].material as MeshStandardMaterial).emissiveIntensity).toBe(1);
  });

  describe('shape keys', () => {
    it('writes weights by name to every part that has the key, and ignores parts without shape keys', () => {
      const rig = new InstancedModelRig([part('membrane', { morph: ['deforming', 'ruptured'] }), part('plain')], 4);
      rig.setMorphsAt(2, { ruptured: 0.8, deforming: 0.3, unknown: 1 });
      const tex = rig.meshes[0].morphTexture!.source.data.data as Float32Array;
      const row = 3; // base influence + two targets
      expect(Array.from(tex.slice(2 * row, 3 * row)).map((v) => +v.toFixed(3))).toEqual([1, 0.3, 0.8]);
      expect(rig.meshes[1].morphTexture).toBeNull();
    });

    it('starts every instance at rest weights (relative morphs keep base influence 1)', () => {
      const rig = new InstancedModelRig([part('membrane', { morph: ['deforming', 'ruptured'] })], 3);
      const tex = rig.meshes[0].morphTexture!.source.data.data as Float32Array;
      expect(Array.from(tex)).toEqual([1, 0, 0, 1, 0, 0, 1, 0, 0]);
    });
  });

  describe('membrane tear', () => {
    it('renames the burst mask, adds the per-instance amount and patches the material', () => {
      const rig = new InstancedModelRig([part('membrane', { burst: true, transparent: true })], 5);
      const geo = rig.meshes[0].geometry;
      expect(geo.getAttribute(BURST_MASK_ATTRIBUTE)).toBeDefined();
      expect(geo.getAttribute('_burst')).toBeUndefined();
      expect(geo.getAttribute(BURST_AMOUNT_ATTRIBUTE).count).toBe(5);
      expect(rig.hasBurst()).toBe(true);
      expect(typeof (rig.meshes[0].material as MeshStandardMaterial).onBeforeCompile).toBe('function');
      rig.setBurstAt(3, 0.6);
      expect(geo.getAttribute(BURST_AMOUNT_ATTRIBUTE).getX(3)).toBeCloseTo(0.6, 5);
    });

    it('injects the discard into the shader source', () => {
      const rig = new InstancedModelRig([part('membrane', { burst: true })], 1);
      const shader = {
        vertexShader: '#include <common>\n#include <begin_vertex>',
        fragmentShader: '#include <common>\n#include <clipping_planes_fragment>',
      };
      (rig.meshes[0].material as MeshStandardMaterial).onBeforeCompile(shader as never, null as never);
      expect(shader.vertexShader).toContain(`attribute float ${BURST_MASK_ATTRIBUTE}`);
      expect(shader.vertexShader).toContain(`vBurstAmount = ${BURST_AMOUNT_ATTRIBUTE}`);
      expect(shader.fragmentShader).toContain('discard');
    });

    it('is inert for models without a burst mask', () => {
      const rig = new InstancedModelRig([part('plain')], 2);
      expect(rig.hasBurst()).toBe(false);
      expect(() => rig.setBurstAt(0, 1)).not.toThrow();
      expect(rig.meshes[0].geometry.getAttribute(BURST_AMOUNT_ATTRIBUTE)).toBeUndefined();
    });
  });

  it('commit flags the buffers for upload, and dispose frees what the rig owns', () => {
    const rig = new InstancedModelRig([part('m', { morph: ['a'] })], 2);
    const versionBefore = rig.meshes[0].instanceMatrix.version;
    rig.commit();
    expect(rig.meshes[0].instanceMatrix.version).toBeGreaterThan(versionBefore);
    let disposed = 0;
    rig.meshes[0].geometry.addEventListener('dispose', () => disposed++);
    (rig.meshes[0].material as MeshStandardMaterial).addEventListener('dispose', () => disposed++);
    rig.dispose();
    expect(disposed).toBe(2);
  });
});
