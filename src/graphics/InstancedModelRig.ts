import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  type Material,
  type Matrix4,
  type Mesh,
} from 'three';
import type { ModelPart } from '../assets/collectMeshes';
import { SELF_LUMINANCE, liftEmissive } from './emissive';
import { BURST_AMOUNT_ATTRIBUTE, BURST_MASK_ATTRIBUTE, isStandardMaterial, patchBurstMaterial } from './burstMaterial';

export interface RigOptions {
  /** Part names (prefix match), innermost first. Unlisted parts draw first. */
  drawOrder?: string[];
  /**
   * Brightest emissive channel to lift emissive materials to. The exported files carry the spec's emission (colour ×
   * 0.03–0.08) which is far below 0.05 in glTF units, so without this the cells read as black. 0 disables.
   */
  selfLuminance?: number;
}

const BURST_SOURCE_NAMES = ['_burst', '_BURST'];

/**
 * Turns a loaded model's parts into InstancedMeshes that share one set of per-instance data (matrices, colours,
 * shape-key weights, rupture amount). A part is one draw call, so a 2-part cell drawn 200 times costs 2 draw calls.
 * Geometry and materials are cloned, so the cached GLTF is never mutated and the rig can be disposed freely.
 */
export class InstancedModelRig {
  readonly group = new Group();
  readonly meshes: InstancedMesh[] = [];
  readonly count: number;

  private readonly parts: ModelPart[];
  private readonly selfLuminance: number;
  private readonly matrices: InstancedBufferAttribute;
  private readonly colors: InstancedBufferAttribute;
  private readonly burst: InstancedBufferAttribute | null;
  private readonly morphDummies: { morphTargetInfluences: number[] }[] = [];
  private readonly owned: { geometry: BufferGeometry; materials: Material[] }[] = [];

  constructor(parts: ModelPart[], count: number, { drawOrder = [], selfLuminance = SELF_LUMINANCE }: RigOptions = {}) {
    this.parts = parts;
    this.count = count;
    this.matrices = new InstancedBufferAttribute(new Float32Array(count * 16), 16).setUsage(DynamicDrawUsage);
    this.colors = new InstancedBufferAttribute(new Float32Array(count * 3).fill(1), 3).setUsage(DynamicDrawUsage);
    const needsBurst = parts.some((p) => p.customAttributes.some((a) => BURST_SOURCE_NAMES.includes(a)));
    this.burst = needsBurst ? new InstancedBufferAttribute(new Float32Array(count), 1).setUsage(DynamicDrawUsage) : null;

    // Identity matrices until the caller writes real ones, so an unset instance isn't a degenerate zero matrix.
    for (let i = 0; i < count; i++) {
      const o = i * 16;
      this.matrices.array[o] = this.matrices.array[o + 5] = this.matrices.array[o + 10] = this.matrices.array[o + 15] = 1;
    }

    this.selfLuminance = selfLuminance;
    parts.forEach((part) => this.addPart(part, drawOrder));
    for (let i = 0; i < count; i++) this.setMorphsAt(i, {});
    this.commit();
  }

  private addPart(part: ModelPart, drawOrder: string[]) {
    const geometry = part.geometry.clone();
    const srcBurst = BURST_SOURCE_NAMES.find((n) => geometry.getAttribute(n));
    if (srcBurst && this.burst) {
      geometry.setAttribute(BURST_MASK_ATTRIBUTE, geometry.getAttribute(srcBurst));
      geometry.deleteAttribute(srcBurst);
      geometry.setAttribute(BURST_AMOUNT_ATTRIBUTE, this.burst);
    }

    const sources = Array.isArray(part.material) ? part.material : [part.material];
    const materials = sources.map((m) => {
      const clone = m.clone();
      // Nested translucent shells must not hide each other through the depth buffer.
      if (clone.transparent) {
        clone.depthWrite = false;
        // Without depth writes a double-sided translucent shell needs no separate back-face pass: halves its triangles.
        clone.forceSinglePass = true;
      }
      if (isStandardMaterial(clone)) {
        liftEmissive(clone, this.selfLuminance);
        if (srcBurst) patchBurstMaterial(clone);
      }
      return clone;
    });

    const mesh = new InstancedMesh(geometry, Array.isArray(part.material) ? materials : materials[0], this.count);
    mesh.name = part.name;
    mesh.instanceMatrix = this.matrices;
    mesh.instanceColor = this.colors;
    mesh.frustumCulled = false;
    const rank = drawOrder.findIndex((prefix) => part.name.startsWith(prefix));
    mesh.renderOrder = rank === -1 ? 0 : rank + 1;
    this.meshes.push(mesh);
    this.group.add(mesh);
    this.morphDummies.push({ morphTargetInfluences: new Array(part.morphTargetNames.length).fill(0) });
    this.owned.push({ geometry, materials });
  }

  setMatrixAt(index: number, matrix: Matrix4): void {
    matrix.toArray(this.matrices.array as unknown as number[], index * 16);
  }

  setColorAt(index: number, color: Color): void {
    this.colors.setXYZ(index, color.r, color.g, color.b);
  }

  /** Sets shape-key weights by name for every part that has them; keys a part lacks are ignored. */
  setMorphsAt(index: number, weights: Record<string, number>): void {
    this.meshes.forEach((mesh, m) => {
      const names = this.parts[m].morphTargetNames;
      if (names.length === 0) return;
      const dummy = this.morphDummies[m];
      names.forEach((name, k) => (dummy.morphTargetInfluences[k] = weights[name] ?? 0));
      mesh.setMorphAt(index, dummy as unknown as Mesh);
    });
  }

  /** Rupture amount (0–1) for the membrane tear shader. No-op when the model has no burst mask. */
  setBurstAt(index: number, amount: number): void {
    this.burst?.setX(index, amount);
  }

  hasBurst(): boolean {
    return this.burst !== null;
  }

  /** Marks everything written since the last commit for upload. Call once per update, not per instance. */
  commit(): void {
    this.matrices.needsUpdate = true;
    this.colors.needsUpdate = true;
    if (this.burst) this.burst.needsUpdate = true;
    for (const mesh of this.meshes) if (mesh.morphTexture) mesh.morphTexture.needsUpdate = true;
  }

  dispose(): void {
    for (const mesh of this.meshes) mesh.morphTexture?.dispose();
    for (const { geometry, materials } of this.owned) {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    }
  }
}
