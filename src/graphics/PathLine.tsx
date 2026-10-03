import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { AdditiveBlending, NormalBlending, Vector3 } from 'three';
import type { Line2 } from 'three-stdlib';
import { lutPoint, type PathLut, type Vec3 } from '../lib/cascade';

export interface PathLineProps {
  lut: PathLut;
  color: string;
  /** How much of the tube is lit, 0–1. */
  getReveal: () => number;
  /** 0–1 brightness of the lit part. */
  getEmphasis: () => number;
  /** Dashed instead of a continuous trail (reduced motion: static dashed lines in place of flowing particles). */
  dashed?: boolean;
  blend?: 'additive' | 'normal';
  /** The faint full-length line under the lit part. Off for trails that should appear only once reached. */
  showBase?: boolean;
  /** 0–1 overall visibility (the whole trail fades in with its scene), read every frame. */
  getPresence?: () => number;
}

const SEGMENTS = 96;
const tmp: Vec3 = [0, 0, 0];

/**
 * A thin luminous trail along a tube (asset spec `s2_tube`): a faint line for the whole path, a brighter line over the
 * part the stream has reached, and a wider soft halo under that.
 */
export function PathLine({ lut, color, getReveal, getEmphasis, dashed = false, blend = 'additive', showBase = true, getPresence }: PathLineProps) {
  const points = useMemo(
    () => Array.from({ length: SEGMENTS + 1 }, (_, i) => new Vector3(...lutPoint(lut, i / SEGMENTS, tmp))),
    [lut],
  );
  const lit = useRef<Line2>(null);
  const halo = useRef<Line2>(null);
  const base = useRef<Line2>(null);
  const blending = blend === 'additive' ? AdditiveBlending : NormalBlending;

  useEffect(() => {
    // Line2 draws instanceCount segments; start fully hidden so nothing flashes before the first frame.
    for (const l of [lit.current, halo.current]) if (l) (l.geometry as unknown as { instanceCount: number }).instanceCount = 0;
  }, []);

  useFrame(() => {
    const reveal = getReveal();
    const presence = getPresence ? getPresence() : 1;
    const emphasis = getEmphasis() * presence;
    const count = Math.round(reveal * SEGMENTS);
    for (const l of [lit.current, halo.current]) {
      if (l) (l.geometry as unknown as { instanceCount: number }).instanceCount = count;
    }
    if (lit.current) lit.current.material.opacity = 0.9 * emphasis;
    if (halo.current) halo.current.material.opacity = 0.28 * emphasis;
    if (base.current) base.current.material.opacity = showBase ? (0.16 + 0.1 * emphasis) * presence : 0;
  });

  const dash = dashed ? { dashed: true, dashSize: 0.18, gapSize: 0.14 } : {};
  return (
    <>
      <Line ref={base} points={points} color={color} lineWidth={1} transparent opacity={0.2} depthWrite={false} {...dash} />
      <Line ref={halo} points={points} color={color} lineWidth={7} transparent opacity={0} depthWrite={false} blending={blending} />
      <Line ref={lit} points={points} color={color} lineWidth={2} transparent opacity={0} depthWrite={false} {...dash} />
    </>
  );
}
