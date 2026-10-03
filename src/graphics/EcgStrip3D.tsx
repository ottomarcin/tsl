import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import { MONITOR_COLORS } from '../components/EcgCanvas/EcgCanvas';
import { useAppStore } from '../store/useAppStore';
import type { EcgState } from '../lib/ecg';
import { EcgTrace } from '../lib/ecgTrace';

export interface EcgStripProps {
  /** Size in scene units. */
  width: number;
  height: number;
  /** The trace to draw. Created by the caller so other parts of the scene (the heart) can follow its beat. */
  trace: EcgTrace;
  /** Target state, read every frame. */
  getState: () => EcgState;
  /** 0–1 rhythm irregularity, read every frame. */
  getIrregularity: () => number;
  /** 0–1 overall visibility, read every frame. */
  getOpacity: () => number;
  /** Still strip instead of a scrolling one. */
  reducedMotion?: boolean;
}

/** Pixel density of the strip's texture, per scene unit. */
const PX_PER_UNIT = 64;

/** Builds the trace for a strip of the given scene size: one pixel column per texel. */
export function createStripTrace(width: number, height: number, initialState: EcgState = 'normal_sinus'): EcgTrace {
  return new EcgTrace({ width: Math.round(width * PX_PER_UNIT), height: Math.round(height * PX_PER_UNIT), initialState });
}

/**
 * The ECG monitor strip as a plane in the 3D scene, textured from a 2D canvas, so it scales and sits with the heart it
 * belongs to. Follows the theme.
 */
export function EcgStrip3D({ width, height, trace, getState, getIrregularity, getOpacity, reducedMotion = false }: EcgStripProps) {
  const colors = MONITOR_COLORS[useAppStore((s) => s.theme)];
  const surface = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = trace.width;
    canvas.height = trace.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    return { ctx, texture };
  }, [trace]);
  useEffect(() => () => surface?.texture.dispose(), [surface]);

  useFrame((_, delta) => {
    // The trace advances whether or not it can be drawn: the heart follows its beat.
    const state = getState();
    if (reducedMotion) {
      if (trace.state !== state) trace.fillStatic(state);
    } else {
      trace.setState(state);
      trace.step(Math.min(delta, 0.1), getIrregularity());
    }
    if (!surface) return;
    trace.draw(surface.ctx, colors);
    surface.texture.needsUpdate = true;
  });

  return (
    <mesh renderOrder={4}>
      <planeGeometry args={[width, height]} />
      <MonitorMaterial texture={surface?.texture ?? null} getOpacity={getOpacity} />
    </mesh>
  );
}

function MonitorMaterial({ texture, getOpacity }: { texture: CanvasTexture | null; getOpacity: () => number }) {
  const ref = useMemo(() => ({ current: null as import('three').MeshBasicMaterial | null }), []);
  useFrame(() => {
    if (ref.current) ref.current.opacity = getOpacity();
  });
  return <meshBasicMaterial ref={(m) => void (ref.current = m)} map={texture} color={texture ? '#ffffff' : '#0B0E12'} transparent opacity={0} toneMapped={false} depthWrite={false} />;
}
