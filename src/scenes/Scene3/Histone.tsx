import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color } from 'three';
import { getSoftParticleTexture } from '../../graphics/softParticleTexture';
import { seededRandom } from '../../lib/massLayout';
import { lodgedPoints, lumenRadiusAt, overlayStrength, TUBE, type InflowCrystal } from '../../lib/renal';
import type { Scene3Getters } from './shared';

export interface HistoneProps extends Scene3Getters {
  crystals: InflowCrystal[];
  color: string;
}

const COUNT = 40;
const LIFE = 2.0;
const SPEED = 0.15;

/**
 * Wisps of grey-white matter drifting out through the wall (asset spec `s3_histone_particles`): 70% start near lodged
 * crystals, 30% anywhere on the wall. Normal blending, no glow: this is damage, not energy. Shown only for the
 * histone-mediated mechanism.
 */
export function Histone({ crystals, color, getProgress, getPresence, getMechanism, reducedMotion }: HistoneProps) {
  const seeds = useMemo(() => {
    const rand = seededRandom(23);
    return Array.from({ length: COUNT }, (_, i) => ({
      near: i < Math.round(COUNT * 0.7),
      phase: rand(),
      s: rand(),
      angle: rand() * Math.PI * 2,
      jitter: [rand() - 0.5, rand() - 0.5, rand() - 0.5] as const,
    }));
  }, []);
  const rgb = useMemo(() => {
    const c = new Color(color);
    return [c.r, c.g, c.b] as const;
  }, [color]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(COUNT * 4), 4));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = getProgress();
    const strength = getMechanism() === 'histone' ? overlayStrength(p) * getPresence() : 0;
    const lodges = lodgedPoints(crystals, p);
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const col = geometry.getAttribute('color') as BufferAttribute;
    const t = reducedMotion ? 0.5 : clock.elapsedTime;
    seeds.forEach((w, i) => {
      const age = (((t / LIFE + w.phase) % 1) + 1) % 1; // 0..1 through its life
      let x: number;
      let y: number;
      let z: number;
      if (w.near && lodges.length > 0) {
        const l = lodges[i % lodges.length];
        [x, y, z] = [l[0], l[1], l[2]];
      } else {
        z = TUBE.length / 2 - w.s * TUBE.length;
        const r = lumenRadiusAt(z);
        [x, y] = [Math.cos(w.angle) * r, Math.sin(w.angle) * r];
      }
      // Outward through the wall, slowing as it goes (drag 0.1/s).
      const out = SPEED * LIFE * (1 - Math.exp(-0.9 * age)) * 0.9;
      const len = Math.hypot(x, y) || 1;
      pos.setXYZ(i, x + (x / len) * out + w.jitter[0] * 0.08, y + (y / len) * out + w.jitter[1] * 0.08, z + w.jitter[2] * 0.12);
      col.setXYZW(i, rgb[0], rgb[1], rgb[2], strength * 0.6 * (1 - age));
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.5} sizeAttenuation vertexColors transparent depthWrite={false} map={getSoftParticleTexture() ?? undefined} />
    </points>
  );
}
