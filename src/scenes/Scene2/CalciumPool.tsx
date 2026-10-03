import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color } from 'three';
import { getSoftParticleTexture } from '../../graphics/softParticleTexture';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { CALCIUM, MERGE_T, POOL_CENTER, POOL_RADIUS, buildCalcium, calciumRemaining, calciumState, getTubeLuts, lutPoint, type Vec3 } from '../../lib/cascade';
import type { ProgressProps } from './Organs';

export interface CalciumPoolProps extends ProgressProps {
  color: string;
  label: string;
}

const ease = (t: number) => t * t * (3 - 2 * t);
const tmp: Vec3 = [0, 0, 0];

/**
 * The chalky calcium reservoir beside the phosphate tube. Particles leave it on a schedule bound to scene progress
 * (not physics), so the pool depletes from 60 to ~10 while scrolling through step 2.2 and refills when scrolling back.
 */
export function CalciumPool({ color, label, getProgress, reducedMotion }: CalciumPoolProps) {
  const particles = useMemo(() => buildCalcium(), []);
  const rgb = useMemo(() => {
    const c = new Color(color);
    return [c.r, c.g, c.b] as const;
  }, [color]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(CALCIUM.count * 3), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(CALCIUM.count * 4), 4));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const merge = useMemo(() => lutPoint(getTubeLuts().PO4, MERGE_T, [0, 0, 0]), []);

  useFrame(({ clock }) => {
    const progress = getProgress();
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const col = geometry.getAttribute('color') as BufferAttribute;
    const time = reducedMotion ? 0 : clock.elapsedTime;
    particles.forEach((p, i) => {
      const s = calciumState(p, progress);
      // Brownian-looking shimmer while resting in the pool.
      const jx = reducedMotion ? 0 : 0.03 * Math.sin(time * 2.1 + p.phase);
      const jy = reducedMotion ? 0 : 0.03 * Math.cos(time * 1.7 + p.phase * 1.3);
      const k = ease(s.travel);
      tmp[0] = p.home[0] + (merge[0] - p.home[0]) * k + jx;
      tmp[1] = p.home[1] + (merge[1] - p.home[1]) * k + jy + Math.sin(Math.PI * k) * 0.25;
      tmp[2] = p.home[2] + (merge[2] - p.home[2]) * k;
      pos.setXYZ(i, tmp[0], tmp[1], tmp[2]);
      col.setXYZW(i, rgb[0], rgb[1], rgb[2], s.visible ? 1 : 0);
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  const remaining = () => calciumRemaining(particles, getProgress());
  return (
    <>
      <points geometry={geometry} frustumCulled={false}>
        <pointsMaterial size={0.2} sizeAttenuation vertexColors transparent depthWrite={false} map={getSoftParticleTexture() ?? undefined} />
      </points>
      {/* Faint outline of the volume. */}
      <mesh position={POOL_CENTER}>
        <sphereGeometry args={[POOL_RADIUS + 0.1, 24, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} depthWrite={false} wireframe />
      </mesh>
      <ScenePointLabel position={[POOL_CENTER[0], POOL_CENTER[1] - 1.1, 0]} text={label} color={color} opacity={remaining() > 0 ? 1 : 0} />
    </>
  );
}
