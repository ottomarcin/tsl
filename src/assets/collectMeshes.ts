import type { BufferGeometry, Material, Mesh, Object3D } from 'three';

export interface ModelPart {
  /** Node name from the file, e.g. 'membrane'. */
  name: string;
  geometry: BufferGeometry;
  material: Material | Material[];
  /** Shape-key names in index order (empty when the mesh has none). */
  morphTargetNames: string[];
  /** Names of non-standard vertex attributes the app shaders read (those starting with '_', e.g. '_BURST'). */
  customAttributes: string[];
}

/**
 * Flattens a loaded scene into its renderable parts, in file order. Instanced rendering needs one InstancedMesh per
 * part (a part is one draw call), all sharing the same instance matrices.
 */
export function collectMeshes(root: Object3D): ModelPart[] {
  const parts: ModelPart[] = [];
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    const dict = mesh.morphTargetDictionary ?? {};
    const morphTargetNames: string[] = [];
    for (const [name, index] of Object.entries(dict)) morphTargetNames[index] = name;
    parts.push({
      name: mesh.name,
      geometry: mesh.geometry,
      material: mesh.material,
      morphTargetNames,
      customAttributes: Object.keys(mesh.geometry.attributes).filter((a) => a.startsWith('_')),
    });
  });
  return parts;
}
