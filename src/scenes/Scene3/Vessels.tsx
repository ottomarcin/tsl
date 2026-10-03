import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CylinderGeometry, MeshStandardMaterial, type Group, type Mesh } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { overlayStrength } from '../../lib/renal';
import { useModelClone } from '../Scene2/useModelClone';
import { patchOuterCut } from './NephronTube';
import type { Scene3Getters } from './shared';

/**
 * The afferent arteriole in tubule model space: a short vessel rising from below the inflow end into the capillary
 * network that wraps the tube. It stays inside the frame and clear of the top-right minimap, so it comes from below
 * rather than along the axis.
 */
const ARTERIOLE = { z: 1.85, yStart: -1.15, yEnd: -0.2, radius: 0.07 } as const;
/** How far the arteriole narrows under vasoconstriction (fraction of its resting radius that remains). */
const NARROWED = 0.42;
const CAPILLARY_REST_OPACITY = 0.6;
const DIMMED = 0.3;

/**
 * Vasoconstriction overlay (clinical-review decision S3.1). The capillary network keeps a constant calibre, because
 * capillaries have no smooth muscle and cannot constrict; what narrows is a short afferent arteriole upstream, and the
 * network dims to show the reduced perfusion. Hidden unless that mechanism is chosen.
 */
export function Vessels({ getProgress, getPresence, getMechanism, reducedMotion }: Scene3Getters) {
  const caps = useModelClone('capillaries');
  const group = useRef<Group>(null);
  const arteriole = useRef<Mesh>(null);
  const amount = useRef(0);

  const arterioleGeometry = useMemo(() => new CylinderGeometry(ARTERIOLE.radius, ARTERIOLE.radius, Math.abs(ARTERIOLE.yStart - ARTERIOLE.yEnd), 20, 1, true), []);
  const arterioleMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#7E8E9E', emissive: '#7E8E9E', emissiveIntensity: 0.25, transparent: true, opacity: 0.8, depthWrite: false }),
    [],
  );
  // The network wraps the tube all the way round; cut it with the tube so nothing floats in front of the opening.
  useEffect(() => {
    caps.materials.forEach((m) => patchOuterCut(m));
  }, [caps.materials]);
  useEffect(
    () => () => {
      arterioleGeometry.dispose();
      arterioleMaterial.dispose();
    },
    [arterioleGeometry, arterioleMaterial],
  );

  useFrame((_, delta) => {
    const target = getMechanism() === 'vasoconstriction' ? overlayStrength(getProgress()) : 0;
    // 800 ms ease, or instant under reduced motion.
    amount.current = reducedMotion ? target : amount.current + (target - amount.current) * Math.min(1, delta * 3.5);
    const a = amount.current;
    const presence = getPresence();
    if (group.current) group.current.visible = a > 0.01 && presence > 0.01;
    // The network dims as perfusion falls; its calibre does not change.
    caps.materials.forEach((m) => {
      m.transparent = true;
      m.opacity = CAPILLARY_REST_OPACITY * (1 - (1 - DIMMED) * a) * a * presence;
    });
    if (arteriole.current) {
      const r = 1 - (1 - NARROWED) * a;
      arteriole.current.scale.set(r, 1, r);
    }
    arterioleMaterial.opacity = 0.8 * a * presence;
  });

  const mid = (ARTERIOLE.yStart + ARTERIOLE.yEnd) / 2;
  return (
    <group ref={group} visible={false}>
      <primitive object={caps.root} />
      <mesh ref={arteriole} geometry={arterioleGeometry} material={arterioleMaterial} position={[0, mid, ARTERIOLE.z]} />
    </group>
  );
}

/** The arteriole's label lives outside the scaled tubule group so its text keeps its size. `position` is in scene space. */
export function ArterioleLabel({ position, getMechanism, getProgress }: { position: [number, number, number]; getMechanism: () => string; getProgress: () => number }) {
  return (
    <ScenePointLabel
      position={position}
      text="Afferent arteriole"
      color="var(--text-secondary)"
      getOpacity={() => (getMechanism() === 'vasoconstriction' ? overlayStrength(getProgress()) : 0)}
    />
  );
}

