import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { collectMeshes } from '../../assets/collectMeshes';
import { useModel } from '../../assets/useModel';
import { tlsModels } from '../../content/tls/models';
import { InstancedModelRig } from '../../graphics/InstancedModelRig';
import { massMatrix, pulseScale } from '../../graphics/massTransform';
import { cellState } from '../../lib/cytolysis';
import type { MassInstance } from '../../lib/massLayout';

export interface CellMassProps {
  instances: MassInstance[];
  /** Each cell's `waveCoordinate`. */
  waveCoords: ArrayLike<number>;
  /** Progress through the cytolysis scene (0 = every cell intact), read every frame. */
  getLocal: () => number;
  /** Stops the breathing pulse. */
  reducedMotion: boolean;
}

const tint = new Color();

/**
 * The tumor mass, one model for the whole of Scenes 0 and 1: the rupture cell (its rest pose is the Scene 0 cell), so
 * nothing swaps at the scene boundary. Cells breathe while intact; the `deforming` shape key follows the wave, the
 * `ruptured` key and the membrane-tear shader (`_BURST` mask) follow the burst, then each cell shrinks away.
 * Suspends while loading: wrap in a ModelBoundary.
 */
export function CellMass({ instances, waveCoords, getLocal, reducedMotion }: CellMassProps) {
  const gltf = useModel(tlsModels, 'cellRupture', 'instanced');
  const parts = useMemo(() => collectMeshes(gltf.scene), [gltf]);
  const drawOrder = tlsModels.models.cellRupture.drawOrder;
  const rig = useMemo(() => new InstancedModelRig(parts, instances.length, { drawOrder }), [parts, instances.length, drawOrder]);
  useEffect(() => () => rig.dispose(), [rig]);
  const settled = useRef(false);
  const time = useRef(0);

  const apply = (progress: number, time: number) => {
    instances.forEach((inst, i) => {
      const s = cellState(progress, waveCoords[i]);
      const pulse = pulseScale(time, 4.2, 0.02, inst.phaseOffset);
      // The shape keys do the deforming; the breathing pulse and the final fade are scales.
      rig.setMatrixAt(i, massMatrix(inst, pulse * s.alive * s.alive));
      rig.setMorphsAt(i, { deforming: s.deform, ruptured: s.rupture });
      rig.setBurstAt(i, s.rupture);
      const glow = 1 + 1.4 * s.deform;
      rig.setColorAt(i, tint.setRGB(inst.colorTint[0] * glow, inst.colorTint[1] * glow * (1 - 0.15 * s.deform), inst.colorTint[2] * glow * (1 - 0.35 * s.deform)));
    });
    rig.commit();
  };

  useLayoutEffect(() => {
    settled.current = false;
    apply(getLocal(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, instances]);

  useFrame((_, delta) => {
    time.current += delta;
    const p = getLocal();
    // Every cell has burst and shrunk away: nothing left to update.
    if (p > 0.92) {
      if (!settled.current) {
        apply(p, 0);
        settled.current = true;
      }
      return;
    }
    settled.current = false;
    apply(p, reducedMotion ? 0 : time.current);
  });

  return <primitive object={rig.group} />;
}
