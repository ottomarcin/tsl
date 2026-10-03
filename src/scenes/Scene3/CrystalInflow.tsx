import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import { collectMeshes } from '../../assets/collectMeshes';
import { useModel } from '../../assets/useModel';
import { tlsModels } from '../../content/tls/models';
import { InstancedModelRig } from '../../graphics/InstancedModelRig';
import type { Vec3 } from '../../lib/cascade';
import { inflowPoint, inflowState, type CrystalKind, type InflowCrystal } from '../../lib/renal';
import type { Scene3Getters } from './shared';

export interface CrystalInflowProps extends Scene3Getters {
  kind: CrystalKind;
  modelId: string;
  crystals: InflowCrystal[];
}

/** Crystal models are ~0.05 across; the spec wants 0.1–0.15 in tubule space ("2× the Scene 2 crystals"). */
const SCALE = 2.6;
const scratch = new Object3D();
const pos: Vec3 = [0, 0, 0];
const tint = new Color(1, 1, 1);

/**
 * The crystals entering the tubule from the inflow end. About 60% stick to the wall at a fixed point and stay (turning
 * very slowly); the rest pass through. One instanced draw call per kind. Position is a pure function of progress.
 */
export function CrystalInflow({ kind, modelId, crystals, getProgress, getPresence, reducedMotion }: CrystalInflowProps) {
  const gltf = useModel(tlsModels, modelId, 'instanced');
  const parts = useMemo(() => collectMeshes(gltf.scene), [gltf]);
  const mine = useMemo(() => crystals.map((c, i) => ({ c, i })).filter(({ c }) => c.kind === kind), [crystals, kind]);
  const rig = useMemo(() => new InstancedModelRig(parts, mine.length), [parts, mine.length]);
  const time = useRef(0);
  useEffect(() => () => rig.dispose(), [rig]);
  // Always drawn over the translucent wall so the viewer can follow every crystal.
  useEffect(() => {
    for (const mesh of rig.meshes) {
      mesh.renderOrder = 10;
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => (m.depthTest = false));
    }
  }, [rig]);

  const apply = (progress: number, presence: number) => {
    mine.forEach(({ c }, k) => {
      const st = inflowState(c, progress);
      if (!st.visible || presence < 0.01) {
        scratch.scale.setScalar(0);
        scratch.position.set(0, 0, 0);
      } else {
        inflowPoint(c, st, pos);
        const grow = Math.min(1, (progress - c.enterAt) * 40 + 0.2);
        const fade = st.s > 0.97 && !c.willLodge ? Math.max(0, 1 - (st.s - 0.97) / 0.07) : 1;
        scratch.position.set(pos[0], pos[1], pos[2]);
        // Lodged crystals turn very slowly (about 3 rev/min).
        scratch.rotation.set(0.4, 0.3, c.spin + (st.lodged ? time.current * 0.3 : 0));
        scratch.scale.setScalar(SCALE * c.scale * grow * fade * presence);
      }
      scratch.updateMatrix();
      rig.setMatrixAt(k, scratch.matrix);
    });
    rig.commit();
  };

  useLayoutEffect(() => {
    mine.forEach((_, k) => rig.setColorAt(k, tint));
    apply(getProgress(), getPresence());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, mine]);

  useFrame((_, delta) => {
    if (!reducedMotion) time.current += delta;
    apply(getProgress(), getPresence());
  });

  return <primitive object={rig.group} />;
}
