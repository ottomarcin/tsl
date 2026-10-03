import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending } from 'three';
import { flowT } from '../lib/cascade';
import { lutPoint, type PathLut, type Vec3 } from '../lib/cascade';
import { getSoftParticleTexture } from './softParticleTexture';

export interface FlowStreamProps {
  lut: PathLut;
  count: number;
  /** Seconds for a particle to travel the whole tube. */
  traversal: number;
  color: string;
  /** How much of the tube is lit, 0–1 (the stream's front). */
  getReveal: () => number;
  /** 0–1 brightness. */
  getEmphasis: () => number;
  size?: number;
  blend?: 'additive' | 'normal';
}

const tmp: Vec3 = [0, 0, 0];

/**
 * Particles flowing along a tube like a quiet current (asset spec `s2_particles_along_spline`). Position along the
 * tube is clock-driven; which part of the tube is lit and how bright is driven by scene progress. Particles beyond the
 * stream's front are hidden and fade in over the last stretch before it.
 */
export function FlowStream({ lut, count, traversal, color, getReveal, getEmphasis, size = 0.17, blend = 'additive' }: FlowStreamProps) {
  const stride = blend === 'normal' ? 4 : 3;
  const rgb = useMemo(() => {
    const c = new Color(color);
    return [c.r, c.g, c.b] as const;
  }, [color]);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(count * stride), stride));
    return g;
  }, [count, stride]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const reveal = getReveal();
    const emphasis = getEmphasis();
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const col = geometry.getAttribute('color') as BufferAttribute;
    const time = clock.elapsedTime;
    for (let j = 0; j < count; j++) {
      const t = flowT(j, count, time, traversal);
      lutPoint(lut, t, tmp);
      pos.setXYZ(j, tmp[0], tmp[1], tmp[2]);
      // Hidden past the front, fading in over the last 6% before it.
      const edge = Math.max(0, Math.min(1, (reveal - t) / 0.06));
      const b = edge * emphasis;
      if (stride === 4) col.setXYZW(j, rgb[0], rgb[1], rgb[2], b);
      else col.setXYZ(j, rgb[0] * b, rgb[1] * b, rgb[2] * b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={blend === 'additive' ? AdditiveBlending : NormalBlending}
        map={getSoftParticleTexture() ?? undefined}
      />
    </points>
  );
}
