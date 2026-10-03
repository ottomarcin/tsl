import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { ScrollProgressSync } from './ScrollProgressSync';
import { DevPlaceholderMesh } from './DevPlaceholderMesh';
import { Scene0 } from '../scenes/Scene0/Scene0';
import { useAppStore } from '../store/useAppStore';
import { SCENE_COUNT } from '../store/types';

function SceneContent({ viewShift }: { viewShift: number }) {
  const route = useAppStore((s) => s.route);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  if (route.kind === 'scene' && route.index === 0) return <Scene0 reducedMotion={reducedMotion} viewShift={viewShift} />;
  // Scenes 1–5 have no 3D content yet (Epics 4–8).
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      <ScrollControls pages={SCENE_COUNT} damping={0.2}>
        <ScrollProgressSync />
        <SceneContent viewShift={viewShift} />
      </ScrollControls>
    </Canvas>
  );
}
