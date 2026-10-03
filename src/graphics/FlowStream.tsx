import { useEffect, useMemo, useRef } from 'react';
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
  /** 0–1 overall visibility, read every frame. */
  getPresence?: () => number;
  /** Multiplier on the flow rate, read every frame (IV hydration speeds the streams up). */
  getSpeed?: () => number;
  /** Where an intervention intercepts the stream, read every frame; null when nothing does. */
  getIntercept?: () => FlowIntercept | null;
}

/**
 * A therapy acting on the stream at normalised tube position `at`: particles fade out as they reach it, by `amount`
 * (1 = none get through). `grey` turns them neutral on the way (rasburicase dissolving uric acid); otherwise they
 * just stop (allopurinol blocking the enzyme).
 */
export interface FlowIntercept {
  at: number;
  amount: number;
  grey: boolean;
}

/** A neutral mid-grey, in the linear space that vertex colours are in (about 50% in sRGB). */
const GREY = [0.21, 0.21, 0.21] as const;
/** Width, in tube length, over which particles fade as they meet the intercept. */
const INTERCEPT_SPAN = 0.14;

const tmp: Vec3 = [0, 0, 0];

/**
 * Particles flowing along a tube like a quiet current (asset spec `s2_particles_along_spline`). Position along the
 * tube is clock-driven; which part of the tube is lit and how bright is driven by scene progress. Particles beyond the
 * stream's front are hidden and fade in over the last stretch before it.
 */
export function FlowStream({ lut, count, traversal, color, getReveal, getEmphasis, size = 0.17, blend = 'additive', getPresence, getSpeed, getIntercept }: FlowStreamProps) {
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

  // The flow clock advances at the stream's own rate, so a change of speed bends the motion instead of jumping it.
  const flowClock = useRef(0);
  useFrame((_, delta) => {
    const reveal = getReveal();
    flowClock.current += Math.min(delta, 0.1) * (getSpeed ? getSpeed() : 1);
    const intercept = getIntercept ? getIntercept() : null;
    const emphasis = getEmphasis() * (getPresence ? getPresence() : 1);
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const col = geometry.getAttribute('color') as BufferAttribute;
    const time = flowClock.current;
    for (let j = 0; j < count; j++) {
      const t = flowT(j, count, time, traversal);
      lutPoint(lut, t, tmp);
      pos.setXYZ(j, tmp[0], tmp[1], tmp[2]);
      // Hidden past the front, fading in over the last 6% before it.
      const edge = Math.max(0, Math.min(1, (reveal - t) / 0.06));
      let b = edge * emphasis;
      let r = rgb[0];
      let g = rgb[1];
      let bl = rgb[2];
      if (intercept) {
        const f = Math.max(0, Math.min(1, (t - (intercept.at - INTERCEPT_SPAN / 2)) / INTERCEPT_SPAN)) * intercept.amount;
        b *= 1 - f;
        if (intercept.grey) {
          r += (GREY[0] - r) * f;
          g += (GREY[1] - g) * f;
          bl += (GREY[2] - bl) * f;
        }
      }
      if (stride === 4) col.setXYZW(j, r, g, bl, b);
      else col.setXYZ(j, r * b, g * b, bl * b);
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
