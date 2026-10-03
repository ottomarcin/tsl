import { useCallback, useMemo } from 'react';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { tlsContent } from '../../content/tls';
import { FlowStream } from '../../graphics/FlowStream';
import { PathLine } from '../../graphics/PathLine';
import {
  CONVERGENCE_POS,
  FLOW,
  KIDNEY_INLET,
  STREAM_IDS,
  buildPathLut,
  convergence,
  getTubeLuts,
  streamEmphasis,
  streamReveal,
  type StreamId,
} from '../../lib/cascade';
import { SCENE2_OFFSET, cascadePresence, localProgress } from '../../lib/timeline';
import { useAppStore } from '../../store/useAppStore';
import { moleculeColor } from '../shared/molecules';
import { useGetG } from '../shared/useGetG';
import { CalciumPool } from './CalciumPool';
import { CrystalFlow } from './CrystalFlow';
import { HeartIcon, Kidney } from './Organs';
import { Waypoints } from './Waypoints';

export interface Scene2Props {
  reducedMotion?: boolean;
}

/** The region of the cascade that must stay in view (the camera framing is computed from it; see Experience). */
export const CASCADE_EXTENT = { halfWidth: 7.2, halfHeight: 6.1 } as const;
/** Where the camera looks, in the cascade's own coordinates: from just above the source cloud (~5.0) to just below the kidney (~-7.2). */
export const CASCADE_LOOK_AT_Y = -1.1;

const KIDNEY_LABEL = 'Kidney';
const ENZYME_LABEL = 'XO';
const CA_LABEL = 'Ca²⁺ reservoir';

/**
 * Scene 2, the cascade: three tubes leave the source cloud, the gathered remains of Scene 1's burst: potassium
 * straight to the heart, phosphate past a calcium pool that it empties into crystals, purines along the long road
 * through xanthine oxidase. Both crystal streams converge on the kidney. Which stream is lit, the calcium, the crystals
 * and the kidney's glow all derive from progress through the scene; only the ambient particle flow is clock-driven.
 * Built around its own origin (the source cloud) and placed so that origin is the world origin, which is where Scene 1's
 * particles gather. Under reduced motion each step shows a still snapshot with dashed tubes instead of flowing particles.
 */
export function Scene2({ reducedMotion = false }: Scene2Props) {
  const theme = useAppStore((s) => s.theme);
  const light = theme === 'light';
  const luts = getTubeLuts();
  const blend = light ? 'normal' : 'additive';
  const getG = useGetG(reducedMotion);
  const getProgress = useCallback(() => localProgress(getG(), 2), [getG]);
  const getPresence = useCallback(() => cascadePresence(getG()), [getG]);

  // The last stretch, from where the tubes meet into the kidney: drawn once the streams converge, in crystal colour.
  const tail = useMemo(
    () => buildPathLut([CONVERGENCE_POS, [0, (CONVERGENCE_POS[1] + KIDNEY_INLET[1]) / 2, 0], KIDNEY_INLET], 16),
    [],
  );
  const purineWaypoints = useMemo(() => tlsContent.cascade.branches.find((b) => b.id === 'purines')?.waypoints ?? [], []);

  return (
    <group position={SCENE2_OFFSET}>
      {STREAM_IDS.map((id: StreamId) => (
        <group key={id}>
          <PathLine
            lut={luts[id]}
            color={moleculeColor(id, theme)}
            getReveal={() => streamReveal(id, getProgress())}
            getEmphasis={() => streamEmphasis(id, getProgress())}
            dashed={reducedMotion}
            blend={blend}
            getPresence={getPresence}
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
        showBase={false}
        dashed={reducedMotion}
        blend={blend}
      />

      {/* Models load independently; a failure or a slow connection leaves the streams and the pool in place. */}
      <ModelBoundary>
        <HeartIcon
          getProgress={getProgress}
          getPresence={getPresence}
          reducedMotion={reducedMotion}
          label={tlsContent.cascade.branches[0].waypoints[0].label}
        />
      </ModelBoundary>
      <ModelBoundary>
        <Kidney getProgress={getProgress} getPresence={getPresence} label={KIDNEY_LABEL} />
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
      <CalciumPool
        color={moleculeColor('Ca', theme)}
        label={CA_LABEL}
        getProgress={getProgress}
        getPresence={getPresence}
        reducedMotion={reducedMotion}
      />
      <ModelBoundary>
        <CrystalFlow kind="caphos" modelId="crystalCaPhos" getProgress={getProgress} reducedMotion={reducedMotion} />
      </ModelBoundary>
      <ModelBoundary>
        <CrystalFlow kind="uricacid" modelId="crystalUricAcid" getProgress={getProgress} reducedMotion={reducedMotion} />
      </ModelBoundary>
    </group>
  );
}
