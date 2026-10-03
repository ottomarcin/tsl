import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Object3D } from 'three';
import type { MassInstance } from '../../lib/massLayout';
import { cellState } from '../../lib/cytolysis';

export interface PlaceholderCellsProps {
  instances: MassInstance[];
  /** Each cell's `waveCoordinate`. */
  waveCoords: ArrayLike<number>;
  /** Progress through the cytolysis scene (0 = intact), read every frame. */
  getLocal: () => number;
}

const _obj = new Object3D();
const _color = new Color();

/**
 * Stand-in for the cell model while it loads (and if it fails to): stretching, swelling icosahedra with the same
 * timing as the real thing, so the scene is never empty and never plays differently.
 */
export function PlaceholderCells({ instances, waveCoords, getLocal }: PlaceholderCellsProps) {
  const mesh = useRef<InstancedMesh>(null);
  const last = useRef(NaN);

  const apply = (progress: number) => {
    const m = mesh.current;
    if (!m) return;
    instances.forEach((inst, i) => {
      const s = cellState(progress, waveCoords[i]);
      const stretch = 1 + 0.25 * s.deform;
      const squash = 1 - 0.12 * s.deform;
      const swell = (1 + 0.45 * s.rupture) * s.alive * s.alive;
      _obj.position.set(...inst.position);
      _obj.quaternion.set(...inst.rotation);
      _obj.scale.set(inst.scale[0] * stretch * swell, inst.scale[1] * squash * swell, inst.scale[2] * squash * swell);
      _obj.updateMatrix();
      m.setMatrixAt(i, _obj.matrix);
      const glow = 1 + 1.4 * s.deform;
      m.setColorAt(i, _color.setRGB(inst.colorTint[0] * glow, inst.colorTint[1] * glow * (1 - 0.15 * s.deform), inst.colorTint[2] * glow * (1 - 0.35 * s.deform)));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => {
    last.current = NaN;
    apply(getLocal());
    last.current = getLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances]);

  useFrame(() => {
    const p = getLocal();
    if (p === last.current) return;
    last.current = p;
    apply(p);
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, instances.length]} frustumCulled={false}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial color="#5D4878" emissive="#2A2030" emissiveIntensity={0.4} roughness={0.6} transparent opacity={0.85} />
    </instancedMesh>
  );
}
