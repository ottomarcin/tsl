import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { EcgStrip3D } from '../../graphics/EcgStrip3D';
import { ECG_LABELS } from '../../lib/ecg';
import type { EcgTrace } from '../../lib/ecgTrace';
import { dysrhythmiaAt, ecgStateAt, panelFocus } from '../../lib/systemic';
import { useModelClone } from '../Scene2/useModelClone';
import { useFade } from '../shared/useFade';
import { HEART_CENTER_Y } from './layout';
import type { Scene4Getters } from './shared';

export interface HeartPanelProps extends Scene4Getters {
  trace: EcgTrace;
  label: string;
}

/** Fraction of a beat, counted from the QRS, during which the ventricles contract (systole, then a short pause). */
const QRS_PHASE = 0.44;

/** 0 relaxed … 1 fully contracted, for a point `phase` of the way through the beat. Rises with the QRS, falls after. */
export function systoleAt(phase: number): number {
  const x = (((phase - QRS_PHASE) % 1) + 1) % 1;
  if (x < 0.1) return smooth(x / 0.1);
  if (x < 0.18) return 1;
  if (x < 0.42) return 1 - smooth((x - 0.18) / 0.24);
  return 0;
}
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * How far the heart's contraction drifts from the trace's beat, as a fraction of a beat: nothing for a regular rhythm,
 * a slight, uneven wander in the pre-terminal rhythm of the last step. Kept small on purpose: the sine-wave rhythm on
 * the monitor is regular (and slow), so a wildly irregular heart would contradict it. The trace itself is left clean:
 * a sine wave has to stay a smooth sine wave.
 */
export function rhythmWander(time: number, dysrhythmia: number): number {
  return dysrhythmia * (0.07 * Math.sin(time * 2.3) + 0.04 * Math.sin(time * 5.1 + 1.3));
}

/**
 * The cardiac panel: the full heart, contracting in step with the ECG trace beneath it (the `systole` shape key follows
 * the trace's beat, so a stuttering rhythm makes a stuttering heart), and the monitor strip with the name of the
 * pattern it shows. Dims while the neuromuscular panel is being discussed.
 */
export function HeartPanel({ trace, label, getProgress, getPresence, reducedMotion, spec }: HeartPanelProps) {
  const { root, materials } = useModelClone('heartFull');
  const group = useRef<Group>(null);
  const focus = () => panelFocus(getProgress()).heart * getPresence();
  const fade = useFade(materials, group, focus);
  const meshes = useRef<Mesh[]>([]);
  if (meshes.current.length === 0) root.traverse((n) => (n as Mesh).isMesh && meshes.current.push(n as Mesh));

  useFrame(({ clock }) => {
    fade();
    // Still heart under reduced motion; otherwise it beats with the trace.
    const w = reducedMotion ? 0 : systoleAt(trace.beatPhase + rhythmWander(clock.elapsedTime, dysrhythmiaAt(getProgress())));
    for (const m of meshes.current) {
      const idx = m.morphTargetDictionary?.systole;
      if (idx !== undefined && m.morphTargetInfluences) m.morphTargetInfluences[idx] = w;
    }
    group.current?.scale.setScalar(spec.heart.scale * (1 + 0.03 * w));
  });

  const [x, y] = spec.heart.position;
  return (
    <>
      <group ref={group} position={[x, y - HEART_CENTER_Y * spec.heart.scale, 0]} scale={spec.heart.scale}>
        <primitive object={root} />
      </group>
      <ScenePointLabel position={[x, y - 1.95 * (spec.heart.scale / 1.5), 0]} text={label} color="var(--text-secondary)" getOpacity={focus} />
    </>
  );
}

/** The monitor strip and its readout, as a separate piece so it can sit in the scene independently of the heart model. */
export function HeartMonitor({ trace, getProgress, getPresence, reducedMotion, spec }: Scene4Getters & { trace: EcgTrace }) {
  const { position, width, height } = spec.ecg;
  const opacity = () => panelFocus(getProgress()).heart * getPresence();
  return (
    <>
      <group position={position}>
        <EcgStrip3D
          width={width}
          height={height}
          trace={trace}
          getState={() => ecgStateAt(getProgress())}
          getIrregularity={() => 0}
          getOpacity={opacity}
          reducedMotion={reducedMotion}
        />
      </group>
      <ScenePointLabel
        position={[position[0], position[1] - height / 2 - 0.35, 0]}
        text=""
        getText={() => ECG_LABELS[ecgStateAt(getProgress())]}
        color="var(--monitor-trace)"
        getOpacity={opacity}
      />
    </>
  );
}
