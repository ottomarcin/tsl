import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { ScrollProgressSync } from './ScrollProgressSync';
import { DevPlaceholderMesh } from './DevPlaceholderMesh';
import { SCENE_COUNT } from '../store/types';

/**
 * The single continuous ScrollControls spanning the whole session (one
 * scroll proxy across all 6 scenes) — this is what makes deep-linking into
 * /scene/3 without scrolling through 0–2 possible (tech arch §6).
 */
export function ScrollCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={0.8} />
      <ScrollControls pages={SCENE_COUNT} damping={0.2}>
        <ScrollProgressSync />
        <DevPlaceholderMesh />
      </ScrollControls>
    </Canvas>
  );
}
