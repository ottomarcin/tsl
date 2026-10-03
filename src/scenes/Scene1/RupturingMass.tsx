import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Object3D } from 'three';
import type { MassInstance } from '../../lib/massLayout';
import { cellState } from '../../lib/cytolysis';

export interface RupturingMassProps {
  instances: MassInstance[];
  getProgress: () => number;
}

const _obj = new Object3D();
const _color = new Color();

/**
 * The tumor mass during cytolysis. Placeholder for s1_cell_rupture.glb's shape keys: a cell stretches while the wave
 * passes (deform), swells as the membrane gives way (rupture), then shrinks out of existence (fade). Cells brighten as
 * they destabilise. Fully derived from progress, so it replays in reverse.
 */
export function RupturingMass({ instances, getProgress }: RupturingMassProps) {
  const mesh = useRef<InstancedMesh>(null);
  const last = useRef(NaN);

  const apply = (progress: number) => {
    const m = mesh.current;
    if (!m) return;
    instances.forEach((inst, i) => {
      const s = cellState(progress, inst.position[0]);
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
    apply(getProgress());
    last.current = getProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances]);

  useFrame(() => {
    const p = getProgress();
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
