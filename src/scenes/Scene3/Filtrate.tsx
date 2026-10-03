import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending } from 'three';
import { getSoftParticleTexture } from '../../graphics/softParticleTexture';
import { seededRandom } from '../../lib/massLayout';
import { FILTRATE, TUBE, filtrateSpeed, lumenRadiusAt, obstructionLevel, type InflowCrystal } from '../../lib/renal';
import type { Scene3Getters } from './shared';

export interface FiltrateProps extends Scene3Getters {
  crystals: InflowCrystal[];
  color: string;
  blend: 'additive' | 'normal';
}

/**
 * Pale-blue droplets of filtrate drifting down the lumen (asset spec `s3_filtrate_flow`). Their speed falls with the
 * obstruction (`0.3 × (1 − 0.8 × level)`), so the flow visibly slows and, with crystals stuck, seems to back up.
 * Particle positions are integrated from the clock; under reduced motion they stay where they are.
 */
export function Filtrate({ crystals, color, blend, getProgress, getPresence, reducedMotion }: FiltrateProps) {
  const stride = blend === 'normal' ? 4 : 3;
  const seeds = useMemo(() => {
    const rand = seededRandom(17);
    return Array.from({ length: FILTRATE.count }, (_, i) => ({
      s: i / FILTRATE.count,
      r: Math.sqrt(rand()) * 0.8,
      angle: rand() * Math.PI * 2,
    }));
  }, []);
  const s = useRef(Float32Array.from(seeds, (p) => p.s));
  const rgb = useMemo(() => {
    const c = new Color(color);
    return [c.r, c.g, c.b] as const;
  }, [color]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(FILTRATE.count * 3), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(FILTRATE.count * stride), stride));
    return g;
  }, [stride]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const progress = getProgress();
    const speed = filtrateSpeed(obstructionLevel(crystals, progress));
    const presence = getPresence();
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const col = geometry.getAttribute('color') as BufferAttribute;
    for (let i = 0; i < FILTRATE.count; i++) {
      if (!reducedMotion) {
        s.current[i] = (s.current[i] + (speed * delta) / TUBE.length) % 1;
      }
      const z = TUBE.length / 2 - s.current[i] * TUBE.length;
      const r = lumenRadiusAt(z) * seeds[i].r;
      pos.setXYZ(i, Math.cos(seeds[i].angle) * r, Math.sin(seeds[i].angle) * r, z);
      // Fade at both ends so droplets appear and leave softly.
      const edge = Math.min(1, s.current[i] / 0.06, (1 - s.current[i]) / 0.06);
      const b = Math.max(0, edge) * presence;
      if (stride === 4) col.setXYZW(i, rgb[0], rgb[1], rgb[2], b);
      else col.setXYZ(i, rgb[0] * b, rgb[1] * b, rgb[2] * b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.26}
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
