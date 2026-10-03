import { BoxGeometry, BufferAttribute, Group, Mesh, MeshStandardMaterial } from 'three';

/** A GLTF-shaped object with a translucent membrane and an inner nucleus, like the real cell files. */
export function fakeCellGltf({ rupture = false }: { rupture?: boolean } = {}) {
  const scene = new Group();
  const make = (name: string, transparent: boolean) => {
    const geometry = new BoxGeometry();
    const n = geometry.attributes.position.count;
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ transparent, opacity: transparent ? 0.5 : 1 }));
    mesh.name = name;
    if (rupture) {
      geometry.morphAttributes.position = [new BufferAttribute(new Float32Array(n * 3), 3), new BufferAttribute(new Float32Array(n * 3), 3)];
      geometry.morphTargetsRelative = true;
      mesh.updateMorphTargets();
      mesh.morphTargetDictionary = { deforming: 0, ruptured: 1 };
      if (name === 'membrane') geometry.setAttribute('_burst', new BufferAttribute(new Float32Array(n), 1));
    }
    return mesh;
  };
  scene.add(make('nucleus', false), make('membrane', true));
  return { scene };
}
