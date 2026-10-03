import { useFrame } from '@react-three/fiber';
import { Color, type Group } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { applyGlow, captureEmissive } from '../../graphics/emissive';
import { HEART_POS, KIDNEY_POS, heartArrival, kidneyLoad, type Vec3 } from '../../lib/cascade';
import { useModelClone } from './useModelClone';
import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';

export interface ProgressProps {
  getProgress: () => number;
  reducedMotion: boolean;
}

const AMBER = new Color('#E8A23D');

/** Stylised heart at the end of the K⁺ tube: pulses at a resting rate, flushes amber as potassium arrives. */
export function HeartIcon({ getProgress, reducedMotion, label }: ProgressProps & { label: string }) {
  const { root, materials } = useModelClone('heartIcon');
  const group = useRef<Group>(null);
  const rest = useRef(materials.map(captureEmissive));

  useFrame(({ clock }) => {
    const arrival = heartArrival(getProgress());
    const beat = Math.sin((2 * Math.PI * clock.elapsedTime) / 0.9);
    // ~67 bpm, ±2%.
    const pulse = reducedMotion ? 1 : 1 + 0.02 * beat;
    group.current?.scale.setScalar(1.55 * pulse);
    // Potassium arriving flushes the heart amber; each beat brightens it a little, so it reads as alive, not lit.
    const flush = arrival * (reducedMotion ? 0.5 : 0.5 + 0.2 * beat);
    materials.forEach((m, i) => applyGlow(m, rest.current[i], AMBER, 0.16 * flush, 1.2 * flush));
  });

  return (
    <>
      <group ref={group} position={HEART_POS} scale={1.55}>
        <primitive object={root} />
      </group>
      <ScenePointLabel position={[HEART_POS[0] + 1.9, HEART_POS[1] - 0.2, 0]} text={label} color="var(--mol-K)" />
    </>
  );
}

/** Bean-shaped kidney at the bottom of the frame, half out of view; glows from within as crystals arrive. */
export function Kidney({ getProgress, label }: Pick<ProgressProps, 'getProgress'> & { label: string }) {
  const { root, materials } = useModelClone('kidney');
  const rest = useRef(materials.map(captureEmissive));
  const GLOW = useRef(new Color('#C9C0A8'));
  const light = useAppStore((st) => st.theme === 'light');
  const restOpacity = useRef(materials.map((m) => m.opacity));

  // The file is 50% translucent so crystals can be seen entering it; on the pale canvas that washes it to lavender mist.
  useEffect(() => {
    materials.forEach((m, i) => (m.opacity = light ? Math.max(restOpacity.current[i], 0.88) : restOpacity.current[i]));
  }, [light, materials]);

  useFrame(() => {
    const load = kidneyLoad(getProgress());
    materials.forEach((m, i) => applyGlow(m, rest.current[i], GLOW.current, 0.1 * load, 0.9 + 1.2 * load));
  });

  return (
    <>
      {/* Tilted ~15° as the brief asks; the file is upright with the hilum on +X. */}
      <group position={KIDNEY_POS} rotation={[0, 0, -0.26]} scale={1.15}>
        <primitive object={root} />
      </group>
      <ScenePointLabel position={[KIDNEY_POS[0] + 2.4, KIDNEY_POS[1] + 0.4, 0]} text={label} color="var(--text-secondary)" />
    </>
  );
}

export type { Vec3 };
