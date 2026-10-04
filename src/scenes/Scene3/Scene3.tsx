import { useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { tlsContent } from '../../content/tls';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { buildInflow, effectiveMechanism, REDUCED_MOTION_PROGRESS } from '../../lib/renal';
import { SCENE3_OFFSET, localProgress, tubulePresence, tubuleScale } from '../../lib/timeline';
import { TUBE_SCALE } from '../../lib/renal';
import { useAppStore } from '../../store/useAppStore';
import { useGetG } from '../shared/useGetG';
import { CrystalInflow } from './CrystalInflow';
import { FeedbackLoop } from './FeedbackLoop';
import { Filtrate } from './Filtrate';
import { Histone } from './Histone';
import { NephronTube } from './NephronTube';
import { ArterioleLabel, Vessels } from './Vessels';
import type { Scene3Getters } from './shared';
import { token } from '../../lib/tokens';

export interface Scene3Props {
  reducedMotion?: boolean;
}

/** The region that must stay in view: the 12-unit tubule across, with room for the loop below it. */
export const TUBULE_EXTENT = { halfWidth: 7.4, halfHeight: 3.9 } as const;

export const SCENE3_ID = 'scene-3';
/** Says outright what the picture is: a lengthwise cut through one tubule, not a cross-section or a blood vessel. */
const TUBE_LABEL = 'Distal tubule (longitudinal section)';
const FEEDBACK_CAPTION = '↓GFR → ↑K⁺, ↑PO₄, ↑UA';

/**
 * Scene 3, renal deposition: a nephron segment seen from the side, translucent, with the crystals from the cascade
 * entering from the right. They drift with the filtrate; about 60% stick to the wall, the lumen narrows around them and
 * the flow slows. From step 3.3 the viewer picks which injury mechanism to highlight; step 3.4 closes the loop. Built
 * around its own origin and placed well below the cascade, which the camera flies down to at the end of Scene 2.
 * Everything that carries the story is a function of progress through the scene.
 */
export function Scene3({ reducedMotion = false }: Scene3Props) {
  const theme = useAppStore((s) => s.theme);
  const light = theme === 'light';
  const blend = light ? 'normal' : 'additive';
  const getG = useGetG(reducedMotion);
  const getProgress = useCallback(() => localProgress(getG(), 3), [getG]);
  const getPresence = useCallback(() => tubulePresence(getG()), [getG]);
  const crystals = useMemo(() => buildInflow(), []);
  const defaultMode = tlsContent.scenes[3].toggle?.defaultId;
  const getMechanism = useCallback(
    () => effectiveMechanism(useAppStore.getState().modeSelection[SCENE3_ID] ?? defaultMode, getProgress()),
    [defaultMode, getProgress],
  );
  // The tubule starts as a tiny thing inside the kidney and grows to full size while the camera settles.
  const grow = useRef<Group>(null);
  useFrame(() => grow.current?.scale.setScalar(TUBE_SCALE * tubuleScale(getG())));
  const getters: Scene3Getters = { getProgress, getPresence, getMechanism, reducedMotion };

  return (
    <group position={SCENE3_OFFSET}>
      {/* Tubule space: axis along Z, inflow (+Z) turned to the right of the screen, drawn 3× larger. */}
      <group ref={grow} rotation={[0, Math.PI / 2, 0]} scale={TUBE_SCALE * tubuleScale(0)}>
        <ModelBoundary>
          <NephronTube crystals={crystals} {...getters} />
        </ModelBoundary>
        <Filtrate crystals={crystals} color={light ? '#1F6FB2' : '#9DC8E8'} blend={blend} {...getters} />
        <ModelBoundary>
          <CrystalInflow kind="caphos" modelId="crystalCaPhos" crystals={crystals} {...getters} />
        </ModelBoundary>
        <ModelBoundary>
          <CrystalInflow kind="uricacid" modelId="crystalUricAcid" crystals={crystals} {...getters} />
        </ModelBoundary>
        <ModelBoundary>
          <Vessels {...getters} />
        </ModelBoundary>
        <Histone crystals={crystals} color={light ? '#6B6A63' : '#C8C5BC'} {...getters} />
      </group>

      <ScenePointLabel position={[-2.6, 1.55, 0]} text={TUBE_LABEL} color="var(--text-secondary)" getOpacity={getPresence} />
      {/* Which way the filtrate runs: in at the right, out at the left. */}
      <ScenePointLabel position={[5.4, -1.3, 0]} text="Inflow" color="var(--text-muted)" subtle getOpacity={getPresence} />
      <ScenePointLabel position={[-5.7, 1.35, 0]} text="Outflow" color="var(--text-muted)" subtle getOpacity={getPresence} />
      <ArterioleLabel position={[5.55, -3.7, 0]} getMechanism={getMechanism} getProgress={getProgress} />
      <ModelBoundary>
        <FeedbackLoop color={token('--flag-red', light ? 'light' : 'dark')} blend={blend} caption={FEEDBACK_CAPTION} {...getters} />
      </ModelBoundary>
    </group>
  );
}

export { REDUCED_MOTION_PROGRESS };
