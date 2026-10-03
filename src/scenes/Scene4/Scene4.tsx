import { useCallback, useMemo } from 'react';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { createStripTrace } from '../../graphics/EcgStrip3D';
import { localProgress, SCENE4_OFFSET, systemicPresence } from '../../lib/timeline';
import { useGetG } from '../shared/useGetG';
import { HandPanel } from './HandPanel';
import { HeartMonitor, HeartPanel } from './HeartPanel';
import { SYSTEMIC_LAYOUTS, type SystemicLayout } from './layout';
import { Origin } from './Origin';
import type { Scene4Getters } from './shared';

export interface Scene4Props {
  reducedMotion?: boolean;
  layout?: SystemicLayout;
}

const HEART_LABEL = 'Heart';
const HAND_LABEL = 'Forearm and hand';
const TROUSSEAU_LABEL = "Trousseau's sign";

/**
 * Scene 4, systemic effects in parallel: a shared origin node with a thread to each of two panels. The cardiac panel is a
 * beating heart over an ECG monitor that moves through the hyperkalaemia patterns; the neuromuscular panel is a hand that
 * moves through the hypocalcaemia poses to Trousseau's spasm, with nerve pulses that turn erratic. Both are functions of
 * progress through the scene. Built around the same point as the tubule, which it replaces by cross-fade.
 */
export function Scene4({ reducedMotion = false, layout = 'side' }: Scene4Props) {
  const spec = SYSTEMIC_LAYOUTS[layout];
  const getG = useGetG(reducedMotion);
  const getProgress = useCallback(() => localProgress(getG(), 4), [getG]);
  const getPresence = useCallback(() => systemicPresence(getG()), [getG]);
  const trace = useMemo(() => createStripTrace(spec.ecg.width, spec.ecg.height), [spec]);
  const getters: Scene4Getters = { getProgress, getPresence, reducedMotion, spec };

  return (
    <group position={SCENE4_OFFSET}>
      <ModelBoundary>
        <Origin {...getters} />
      </ModelBoundary>
      <ModelBoundary>
        <HeartPanel {...getters} trace={trace} label={HEART_LABEL} />
      </ModelBoundary>
      <HeartMonitor {...getters} trace={trace} />
      <ModelBoundary>
        <HandPanel {...getters} label={HAND_LABEL} annotation={TROUSSEAU_LABEL} />
      </ModelBoundary>
    </group>
  );
}
