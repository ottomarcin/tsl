import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { tlsContent } from '../../content/tls';
import { FlowStream } from '../../graphics/FlowStream';
import { PathLine } from '../../graphics/PathLine';
import {
  CONVERGENCE_POS,
  FLOW,
  KIDNEY_INLET,
  buildPathLut,
  convergence,
  REDUCED_MOTION_PROGRESS,
  STREAM_IDS,
  getTubeLuts,
  streamEmphasis,
  streamReveal,
  type StreamId,
} from '../../lib/cascade';
import { stepIndexFromProgress } from '../../lib/steps';
import { useAppStore } from '../../store/useAppStore';
import { moleculeColor } from '../shared/molecules';
import { useSceneFraming } from '../shared/useSceneFraming';
import { CalciumPool } from './CalciumPool';
import { CrystalFlow } from './CrystalFlow';
import { HeartIcon, Kidney } from './Organs';
import { SourceCloud } from './SourceCloud';
import { Waypoints } from './Waypoints';

export interface Scene2Props {
  reducedMotion?: boolean;
  viewShift?: number;
}

/** The region that must stay in view: tubes span x ≈ ±5.4 and y from the source cloud (4.3) down past the whole kidney (bottom ≈ -7.2). */
const EXTENT = { halfWidth: 7.2, halfHeight: 6.1 } as const;
/** The frame runs from just above the source cloud (~5.0) to just below the kidney (~-7.2). */
const LOOK_AT_Y = -1.1;
const STEP_COUNT = 4;

const KIDNEY_LABEL = 'Kidney';
const ENZYME_LABEL = 'XO';
const CA_LABEL = 'Ca²⁺ reservoir';

/**
 * Scene 2, the cascade: three tubes leave the residual cloud from Scene 1: potassium straight to the heart, phosphate
 * past a calcium pool that it empties into crystals, purines along the long road through xanthine oxidase. Both
 * crystal streams converge on the kidney. Which stream is lit, the calcium, the crystals and the kidney's glow all
 * derive from scene progress; only the ambient particle flow is clock-driven. Under reduced motion each step shows a
 * still snapshot with dashed tubes instead of flowing particles.
 */
export function Scene2({ reducedMotion = false, viewShift = 0 }: Scene2Props) {
  const camera = useThree((s) => s.camera);
  const theme = useAppStore((s) => s.theme);
  const light = theme === 'light';
  const distance = useSceneFraming(viewShift, EXTENT);
  const luts = getTubeLuts();
  const blend = light ? 'normal' : 'additive';
  // The last stretch, from where the tubes meet into the kidney: drawn once the streams converge, in crystal colour.
  const tail = useMemo(
    () => buildPathLut([CONVERGENCE_POS, [0, (CONVERGENCE_POS[1] + KIDNEY_INLET[1]) / 2, 0], KIDNEY_INLET], 16),
    [],
  );

  const getProgress = useCallback(() => {
    const raw = useAppStore.getState().sceneProgress;
    return reducedMotion ? REDUCED_MOTION_PROGRESS[stepIndexFromProgress(raw, STEP_COUNT)] : raw;
  }, [reducedMotion]);

  // Layout effect: set before the first frame so arriving from Scene 1 never shows its pulled-back camera.
  useLayoutEffect(() => {
    camera.position.set(0, LOOK_AT_Y, distance);
    camera.lookAt(0, LOOK_AT_Y, 0);
    if (camera instanceof PerspectiveCamera && camera.fov !== 50) {
      camera.fov = 50;
      camera.updateProjectionMatrix();
    }
  }, [camera, distance]);

  // Keep the aim steady against anything that nudged the camera (Scene 1 leaves a slight y offset).
  useFrame(() => {
    if (camera.position.y !== LOOK_AT_Y) {
      camera.position.y = LOOK_AT_Y;
      camera.lookAt(0, LOOK_AT_Y, 0);
    }
  });

  const purineWaypoints = useMemo(() => tlsContent.cascade.branches.find((b) => b.id === 'purines')?.waypoints ?? [], []);
  const cloudColors = useMemo<[string, string, string]>(
    () => [moleculeColor('K', theme), moleculeColor('PO4', theme), moleculeColor('purines', theme)],
    [theme],
  );

  return (
    <>
      <SourceCloud colors={cloudColors} blend={blend} reducedMotion={reducedMotion} />

      {STREAM_IDS.map((id: StreamId) => (
        <group key={id}>
          <PathLine
            lut={luts[id]}
            color={moleculeColor(id, theme)}
            getReveal={() => streamReveal(id, getProgress())}
            getEmphasis={() => streamEmphasis(id, getProgress())}
            dashed={reducedMotion}
            blend={blend}
          />
          {!reducedMotion && (
            <FlowStream
              lut={luts[id]}
              count={FLOW[id].count}
              traversal={FLOW[id].traversal}
              color={moleculeColor(id, theme)}
              getReveal={() => streamReveal(id, getProgress())}
              getEmphasis={() => streamEmphasis(id, getProgress())}
              blend={blend}
            />
          )}
        </group>
      ))}

      <PathLine
        lut={tail}
        color={light ? '#847A60' : '#8E8670'}
        getReveal={() => convergence(getProgress())}
        getEmphasis={() => 0.45}
        dashed={reducedMotion}
        blend={blend}
      />

      {/* Models load independently; a failure or a slow connection leaves the streams and the pool in place. */}
      <ModelBoundary>
        <HeartIcon getProgress={getProgress} reducedMotion={reducedMotion} label={tlsContent.cascade.branches[0].waypoints[0].label} />
      </ModelBoundary>
      <ModelBoundary>
        <Kidney getProgress={getProgress} label={KIDNEY_LABEL} />
      </ModelBoundary>
      <ModelBoundary>
        <Waypoints
          waypoints={purineWaypoints}
          enzymeLabel={ENZYME_LABEL}
          moleculeColor="var(--mol-purines)"
          getProgress={getProgress}
          reducedMotion={reducedMotion}
        />
      </ModelBoundary>
      <CalciumPool color={moleculeColor('Ca', theme)} label={CA_LABEL} getProgress={getProgress} reducedMotion={reducedMotion} />
      <ModelBoundary>
        <CrystalFlow kind="caphos" modelId="crystalCaPhos" getProgress={getProgress} reducedMotion={reducedMotion} />
      </ModelBoundary>
      <ModelBoundary>
        <CrystalFlow kind="uricacid" modelId="crystalUricAcid" getProgress={getProgress} reducedMotion={reducedMotion} />
      </ModelBoundary>
    </>
  );
}
