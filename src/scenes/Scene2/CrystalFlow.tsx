import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Matrix4, Object3D } from 'three';
import { collectMeshes } from '../../assets/collectMeshes';
import { useModel } from '../../assets/useModel';
import { tlsModels } from '../../content/tls/models';
import { InstancedModelRig } from '../../graphics/InstancedModelRig';
import {
  CRYSTALS,
  buildCrystals,
  convergence,
  crystalJourney,
  getTubeLuts,
  journeyPoint,
  type CrystalKind,
  type Vec3,
} from '../../lib/cascade';
import type { ProgressProps } from './Organs';

export interface CrystalFlowProps extends ProgressProps {
  kind: CrystalKind;
  modelId: string;
}

/** The crystal models are ~0.05 units across (spec: 0.06): scaled up so they read at scene scale. */
const SCALE = 6;
const scratch = new Object3D();
const pos: Vec3 = [0, 0, 0];
const tint = new Color(1, 1, 1);

/**
 * Crystals that form where calcium meets phosphate (and where uric acid emerges), drift down their tube and then
 * stream into the kidney. One instanced draw call per kind; position is a pure function of scene progress.
 */
export function CrystalFlow({ kind, modelId, getProgress, reducedMotion }: CrystalFlowProps) {
  const gltf = useModel(tlsModels, modelId, 'instanced');
  const parts = useMemo(() => collectMeshes(gltf.scene), [gltf]);
  const crystals = useMemo(() => buildCrystals(kind), [kind]);
  const { tube, t: startT } = CRYSTALS[kind];
  const lut = getTubeLuts()[tube];
  const rig = useMemo(() => new InstancedModelRig(parts, crystals.length), [parts, crystals.length]);
  useEffect(() => () => rig.dispose(), [rig]);
  // Crystals are drawn over the translucent kidney (not hidden behind it) so the viewer sees them go in.
  useEffect(() => {
    for (const mesh of rig.meshes) {
      mesh.renderOrder = 10;
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => (m.depthTest = false));
    }
  }, [rig]);
  const last = useRef(NaN);
  const lastTime = useRef(NaN);

  const apply = (progress: number, time: number) => {
    const conv = convergence(progress);
    crystals.forEach((c, i) => {
      const u = crystalJourney(c, progress);
      if (u === null) {
        scratch.scale.setScalar(0);
        scratch.position.set(0, 0, 0);
      } else {
        journeyPoint(lut, startT, u, pos);
        // Spread across the tube while drifting, funnelling onto the centre line as the streams converge.
        const spread = 1 - 0.85 * conv;
        const grow = Math.min(1, u * 14 + 0.25);
        // Gone once absorbed by the kidney.
        const absorbed = u > 0.97 ? Math.max(0, 1 - (u - 0.97) / 0.03) : 1;
        scratch.position.set(pos[0] + c.offset[0] * spread, pos[1] + c.offset[1] * spread, pos[2] + c.offset[2]);
        scratch.rotation.set(0.5 + time * 0.2 * (i % 2 ? 1 : -1), 0.3, c.spin + time * 0.3);
        scratch.scale.setScalar(SCALE * c.scale * grow * absorbed);
      }
      scratch.updateMatrix();
      rig.setMatrixAt(i, scratch.matrix as Matrix4);
    });
    rig.commit();
  };

  useLayoutEffect(() => {
    crystals.forEach((_, i) => rig.setColorAt(i, tint));
    apply(getProgress(), 0);
    last.current = getProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, crystals]);

  useFrame(({ clock }) => {
    const p = getProgress();
    const time = reducedMotion ? 0 : clock.elapsedTime;
    if (p === last.current && time === lastTime.current) return;
    last.current = p;
    lastTime.current = time;
    apply(p, time);
  });

  return <primitive object={rig.group} />;
}
