import { describe, expect, it } from 'vitest';
import { BoxGeometry, BufferAttribute, Group, Mesh, MeshBasicMaterial } from 'three';
import { collectMeshes } from './collectMeshes';

describe('collectMeshes', () => {
  it('returns every mesh in file order with its geometry and material', () => {
    const root = new Group();
    const a = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    a.name = 'membrane';
    const inner = new Group();
    const b = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    b.name = 'nucleus';
    inner.add(b);
    root.add(a, inner);
    const parts = collectMeshes(root);
    expect(parts.map((p) => p.name)).toEqual(['membrane', 'nucleus']);
    expect(parts[0].geometry).toBe(a.geometry);
    expect(parts[1].material).toBe(b.material);
  });

  it('lists shape keys in index order', () => {
    const m = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    m.morphTargetDictionary = { ruptured: 1, deforming: 0 };
    expect(collectMeshes(m)[0].morphTargetNames).toEqual(['deforming', 'ruptured']);
  });

  it('reports shader-data attributes (underscore prefix) and ignores standard ones', () => {
    const geo = new BoxGeometry();
    geo.setAttribute('_BURST', new BufferAttribute(new Float32Array(geo.attributes.position.count), 1));
    const parts = collectMeshes(new Mesh(geo, new MeshBasicMaterial()));
    expect(parts[0].customAttributes).toEqual(['_BURST']);
  });

  it('returns nothing for a scene with no meshes', () => {
    expect(collectMeshes(new Group())).toEqual([]);
  });
});
