import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { ScrollProgressSync } from './ScrollProgressSync';
import { Experience } from './Experience';
import { AssetProgressBridge } from './AssetProgressBridge';
import { SCENE_COUNT } from '../store/types';
import { useAppStore } from '../store/useAppStore';
import { token } from '../lib/tokens';

/**
 * Spec values are key 1.0, rim 0.4, fill 0.2. The models' spec colours are very dark, so the rig is scaled up to keep
 * them readable on a near-black background; the ratios between the three lights are the spec's.
 */
const LIGHT_RIG = { key: 3.5, rim: 1.6, fill: 2.5 } as const;

const FALLBACK_BACKGROUND = { dark: token('--bg-canvas', 'dark'), light: token('--bg-canvas', 'light') } as const;

/**
 * An opaque scene background in the page's canvas colour. On a transparent canvas, additive blending also adds alpha,
 * so faded (black) particles came out as opaque black speckles darker than the page around them.
 */
function CanvasBackground() {
  const theme = useAppStore((s) => s.theme);
  const color = useMemo(() => {
    const css = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim();
    return css || FALLBACK_BACKGROUND[theme];
    // The token values change with data-theme, which the store updates alongside `theme`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  return <color attach="background" args={[color]} />;
}

/**
 * The single continuous ScrollControls spanning the whole session (one
 * scroll proxy across all 6 scenes) — this is what makes deep-linking into
 * /scene/3 without scrolling through 0–2 possible (tech arch §6).
 */
export function ScrollCanvas({ viewShift = 0, paused = false }: { viewShift?: number; paused?: boolean }) {
  return (
    <>
    {/* 'never' stops rendering and the clock's frames while the tab is in the background (design spec §10). */}
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      frameloop={paused ? 'never' : 'always'}
      // QA hook (dev server only): lets a script read draw calls and triangles from the renderer.
      onCreated={({ gl }) => {
        if (import.meta.env.DEV) (window as unknown as { __gl?: unknown }).__gl = gl;
      }}
    >
      <CanvasBackground />
      {/* Asset spec §1.5 three-light rig, shared by every scene. */}
      <ambientLight color="#404448" intensity={LIGHT_RIG.fill} />
      <directionalLight color="#E0E6F0" position={[-6, 6, 6]} intensity={LIGHT_RIG.key} />
      <directionalLight color="#F0C080" position={[3, 5, -8]} intensity={LIGHT_RIG.rim} />
      <ScrollControls pages={SCENE_COUNT} damping={0.2}>
        <ScrollProgressSync />
        <Experience viewShift={viewShift} />
      </ScrollControls>
    </Canvas>
    <AssetProgressBridge />
    </>
  );
}
