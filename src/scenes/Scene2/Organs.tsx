import { useFrame } from '@react-three/fiber';
import { Color, type Group } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { applyGlow, captureEmissive } from '../../graphics/emissive';
import { HEART_POS, KIDNEY_POS, heartArrival, kidneyLoad, type Vec3 } from '../../lib/cascade';
import { useFade } from '../shared/useFade';
import { useModelClone } from './useModelClone';
import { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { token } from '../../lib/tokens';

export interface ProgressProps {
  /** Progress through the cascade scene (0–1). */
  getProgress: () => number;
  reducedMotion: boolean;
}

export interface PresenceProps {
  /** 0–1: how much of the static scenery has faded in as the camera arrives. */
  getPresence: () => number;
}

const AMBER = new Color(token('--flag-amber'));

/** Stylised heart at the end of the K⁺ tube: pulses at a resting rate, flushes amber as potassium arrives. */
export function HeartIcon({ getProgress, getPresence, reducedMotion, label }: ProgressProps & PresenceProps & { label: string }) {
  const { root, materials } = useModelClone('heartIcon');
  const group = useRef<Group>(null);
  const rest = useRef(materials.map(captureEmissive));
  const fade = useFade(materials, group, getPresence);

  useFrame(({ clock }) => {
    fade();
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
      <ScenePointLabel position={[HEART_POS[0] + 1.9, HEART_POS[1] - 0.2, 0]} text={label} color="var(--mol-K)" getOpacity={getPresence} />
    </>
  );
}

/** Bean-shaped kidney at the bottom of the frame, half out of view; glows from within as crystals arrive. */
export function Kidney({
  getProgress,
  getPresence,
  label,
  getLoadScale,
}: Pick<ProgressProps, 'getProgress'> & PresenceProps & { label: string; getLoadScale?: () => number }) {
  const { root, materials } = useModelClone('kidney');
  const rest = useRef(materials.map(captureEmissive));
  const GLOW = useRef(new Color(token('--crystal')));
  const light = useAppStore((st) => st.theme === 'light');
  const group = useRef<Group>(null);
  // The file is 50% translucent so crystals can be seen entering it; on the pale canvas that washes it to lavender mist.
  const fade = useFade(materials, group, getPresence, light ? 0.88 : 0);

  useFrame(() => {
    fade();
    const load = kidneyLoad(getProgress()) * (getLoadScale ? getLoadScale() : 1);
    materials.forEach((m, i) => applyGlow(m, rest.current[i], GLOW.current, 0.1 * load, 0.9 + 1.2 * load));
  });

  return (
    <>
      {/* Tilted ~15° as the brief asks; the file is upright with the hilum on +X. */}
      <group ref={group} position={KIDNEY_POS} rotation={[0, 0, -0.26]} scale={1.15}>
        <primitive object={root} />
      </group>
      <ScenePointLabel position={[KIDNEY_POS[0] + 2.4, KIDNEY_POS[1] + 0.4, 0]} text={label} color="var(--text-secondary)" getOpacity={getPresence} />
    </>
  );
}

export type { Vec3 };
