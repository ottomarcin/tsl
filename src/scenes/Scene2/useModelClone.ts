import { useEffect, useMemo } from 'react';
import type { Material, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { useModel } from '../../assets/useModel';
import type { ModelUsage } from '../../content/schema';
import { tlsModels } from '../../content/tls/models';
import { liftEmissive } from '../../graphics/emissive';

export interface ModelClone {
  root: Object3D;
  /** The clone's own materials, free to animate (emissive pulses, colour shifts). */
  materials: MeshStandardMaterial[];
}

/**
 * A private copy of a loaded model with its own materials, so one scene prop can glow without lighting up every other
 * use of the same cached file. Emissive is lifted to the spec's self-luminance. Suspends while loading.
 */
export function useModelClone(id: string, usage: ModelUsage = 'single'): ModelClone {
  const gltf = useModel(tlsModels, id, usage);
  const clone = useMemo<ModelClone>(() => {
    const root = gltf.scene.clone(true);
    const materials: MeshStandardMaterial[] = [];
    root.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      const own = (mesh.material as Material).clone() as MeshStandardMaterial;
      if (own.isMeshStandardMaterial) liftEmissive(own);
      mesh.material = own;
      materials.push(own);
    });
    return { root, materials };
  }, [gltf]);
  useEffect(() => () => clone.materials.forEach((m) => m.dispose()), [clone]);
  return clone;
}
