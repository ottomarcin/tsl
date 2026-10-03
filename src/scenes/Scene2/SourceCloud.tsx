import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending } from 'three';
import { getSoftParticleTexture } from '../../graphics/softParticleTexture';
import { seededRandom } from '../../lib/massLayout';
import { SOURCE_POS } from '../../lib/cascade';

export interface SourceCloudProps {
  colors: [string, string, string];
  blend: 'additive' | 'normal';
  reducedMotion: boolean;
}

const COUNT = 210;

/** The mingled three-colour cloud left over from Scene 1, where the three tubes begin. Shimmers slowly. */
export function SourceCloud({ colors, blend, reducedMotion }: SourceCloudProps) {
  const stride = blend === 'normal' ? 4 : 3;
  const { geometry, base } = useMemo(() => {
    const rand = seededRandom(5);
    const g = new BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * stride);
    const base = new Float32Array(COUNT * 3);
    const palette = colors.map((c) => new Color(c));
    for (let i = 0; i < COUNT; i++) {
      // Roughly gaussian blob, flattened.
      const g1 = (rand() + rand() + rand() - 1.5) * 1.1;
      const g2 = (rand() + rand() + rand() - 1.5) * 0.7;
      const g3 = (rand() + rand() + rand() - 1.5) * 0.5;
      base.set([SOURCE_POS[0] + g1, SOURCE_POS[1] + g2, SOURCE_POS[2] + g3], i * 3);
      positions.set(base.slice(i * 3, i * 3 + 3), i * 3);
      const c = palette[i % 3];
      const b = 0.55 + rand() * 0.45;
      if (stride === 4) col.set([c.r, c.g, c.b, b], i * 4);
      else col.set([c.r * b, c.g * b, c.b * b], i * 3);
    }
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.setAttribute('color', new BufferAttribute(col, stride));
    return { geometry: g, base };
  }, [colors, stride]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      pos.setXYZ(i, base[i * 3] + 0.06 * Math.sin(t * 0.7 + i), base[i * 3 + 1] + 0.06 * Math.cos(t * 0.6 + i * 1.7), base[i * 3 + 2]);
    }
    pos.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.17}
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
