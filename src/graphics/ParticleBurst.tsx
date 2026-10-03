import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points } from 'three';
import { getSoftParticleTexture } from './softParticleTexture';

export interface ParticleBurstProps {
  /** Number of particles (positions/colors buffers are sized from this). */
  count: number;
  /** Fills both buffers for the given progress. Called only when progress changes. */
  fill: (positions: Float32Array, colors: Float32Array, rgb: [number, number, number], progress: number) => void;
  /** Reads the current 0–1 progress each frame. */
  getProgress: () => number;
  color: string;
  size?: number;
}

/**
 * Generic additive particle system driven by an external simulation (tech arch §8.2, "ParticleStream" family).
 * Per-particle fade is baked into vertex colors, which is exact under additive blending.
 */
export function ParticleBurst({ count, fill, getProgress, color, size = 0.2 }: ParticleBurstProps) {
  const points = useRef<Points>(null);
  const lastProgress = useRef<number>(NaN);
  const rgb = useMemo(() => {
    const c = new Color(color);
    return [c.r, c.g, c.b] as [number, number, number];
  }, [color]);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    lastProgress.current = NaN;
  }, [rgb, fill]);

  useFrame(() => {
    const p = getProgress();
    if (p === lastProgress.current) return;
    lastProgress.current = p;
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const col = geometry.getAttribute('color') as BufferAttribute;
    fill(pos.array as Float32Array, col.array as Float32Array, rgb, p);
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        map={getSoftParticleTexture() ?? undefined}
      />
    </points>
  );
}
