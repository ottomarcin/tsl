import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { collectMeshes } from '../../assets/collectMeshes';
import { useModel } from '../../assets/useModel';
import { tlsModels } from '../../content/tls/models';
import { InstancedModelRig } from '../../graphics/InstancedModelRig';
import { massMatrix } from '../../graphics/massTransform';
import { cellState } from '../../lib/cytolysis';
import type { MassInstance } from '../../lib/massLayout';

export interface RupturingModelMassProps {
  instances: MassInstance[];
  /** Each cell's `waveCoordinate`. */
  waveCoords: ArrayLike<number>;
  getProgress: () => number;
}

const tint = new Color();

/**
 * The tumor mass during cytolysis, drawn from the rupture model: the `deforming` shape key follows the wave, the
 * `ruptured` key and the membrane-tear shader (`_BURST` mask) follow the burst, then the cell shrinks away. Fully
 * derived from progress, so it replays in reverse. Suspends while loading: wrap in a ModelBoundary.
 */
export function RupturingModelMass({ instances, waveCoords, getProgress }: RupturingModelMassProps) {
  const gltf = useModel(tlsModels, 'cellRupture', 'instanced');
  const parts = useMemo(() => collectMeshes(gltf.scene), [gltf]);
  const drawOrder = tlsModels.models.cellRupture.drawOrder;
  const rig = useMemo(() => new InstancedModelRig(parts, instances.length, { drawOrder }), [parts, instances.length, drawOrder]);
  useEffect(() => () => rig.dispose(), [rig]);
  const last = useRef(NaN);

  const apply = (progress: number) => {
    instances.forEach((inst, i) => {
      const s = cellState(progress, waveCoords[i]);
      // The shape keys do the deforming; only the final fade is a scale.
      rig.setMatrixAt(i, massMatrix(inst, s.alive * s.alive));
      rig.setMorphsAt(i, { deforming: s.deform, ruptured: s.rupture });
      rig.setBurstAt(i, s.rupture);
      const glow = 1 + 1.4 * s.deform;
      rig.setColorAt(i, tint.setRGB(inst.colorTint[0] * glow, inst.colorTint[1] * glow * (1 - 0.15 * s.deform), inst.colorTint[2] * glow * (1 - 0.35 * s.deform)));
    });
    rig.commit();
  };

  useLayoutEffect(() => {
    apply(getProgress());
    last.current = getProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, instances]);

  useFrame(() => {
    const p = getProgress();
    if (p === last.current) return;
    last.current = p;
    apply(p);
  });

  return <primitive object={rig.group} />;
}
