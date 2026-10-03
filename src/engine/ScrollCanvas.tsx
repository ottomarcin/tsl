import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { ScrollProgressSync } from './ScrollProgressSync';
import { DevPlaceholderMesh } from './DevPlaceholderMesh';
import { Scene0 } from '../scenes/Scene0/Scene0';
import { Scene1 } from '../scenes/Scene1/Scene1';
import { Scene2 } from '../scenes/Scene2/Scene2';
import { useAppStore } from '../store/useAppStore';
import { SCENE_COUNT } from '../store/types';

/**
 * Spec values are key 1.0, rim 0.4, fill 0.2. The models' spec colours are very dark, so the rig is scaled up to keep
 * them readable on a near-black background; the ratios between the three lights are the spec's.
 */
const LIGHT_RIG = { key: 3.5, rim: 1.6, fill: 2.5 } as const;

function SceneContent({ viewShift }: { viewShift: number }) {
  const route = useAppStore((s) => s.route);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  if (route.kind === 'scene' && route.index === 0) return <Scene0 reducedMotion={reducedMotion} viewShift={viewShift} />;
  if (route.kind === 'scene' && route.index === 1) return <Scene1 reducedMotion={reducedMotion} viewShift={viewShift} />;
  if (route.kind === 'scene' && route.index === 2) return <Scene2 reducedMotion={reducedMotion} viewShift={viewShift} />;
  // Scenes 3–5 have no 3D content yet (Epics 6–8).
  return <DevPlaceholderMesh />;
}

/**
 * The single continuous ScrollControls spanning the whole session (one
 * scroll proxy across all 6 scenes) — this is what makes deep-linking into
 * /scene/3 without scrolling through 0–2 possible (tech arch §6).
 */
export function ScrollCanvas({ viewShift = 0 }: { viewShift?: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      {/* Asset spec §1.5 three-light rig, shared by every scene. */}
      <ambientLight color="#404448" intensity={LIGHT_RIG.fill} />
      <directionalLight color="#E0E6F0" position={[-6, 6, 6]} intensity={LIGHT_RIG.key} />
      <directionalLight color="#F0C080" position={[3, 5, -8]} intensity={LIGHT_RIG.rim} />
      <ScrollControls pages={SCENE_COUNT} damping={0.2}>
        <ScrollProgressSync />
        <SceneContent viewShift={viewShift} />
      </ScrollControls>
    </Canvas>
  );
}
