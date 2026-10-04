import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { ParticleBurst } from '../../graphics/ParticleBurst';
import { Wavefront } from '../../graphics/Wavefront';
import {
  CYTOLYSIS_CAMERA_PATH,
  PARTICLES,
  PARTICLE_SYSTEM_SEEDS,
  arrivalProgress,
  buildCloudTargets,
  buildParticleVelocities,
  fillParticleBuffers,
  waveCoordinate,
  waveOpacity,
  waveX,
  type ParticleSystemId,
} from '../../lib/cytolysis';
import { DragOverride } from '../../lib/dragOverride';
import { cloudTransition, idleSway, localProgress, massRotation } from '../../lib/timeline';
import { useAppStore } from '../../store/useAppStore';
import { moleculeColor } from '../shared/molecules';
import { useFraming } from '../shared/framing';
import { getTumorMassLayout } from '../shared/tumorMass';
import { useGetG } from '../shared/useGetG';
import { CellMass } from './CellMass';
import { rotateLayout } from './layout';
import { PlaceholderCells } from './PlaceholderCells';

export interface TumorStageProps {
  reducedMotion?: boolean;
}

const SYSTEMS: ParticleSystemId[] = ['K', 'PO4', 'purines'];
/** Every Nth burst particle survives to become part of the cascade's source cloud (6,000 per colour => 70 each). */
const CLOUD_KEEP_EVERY = 86;

/**
 * Scenes 0 and 1 as one piece of world: the tumor mass turns with the scroll, the wavefront sweeps through it, the
 * cells rupture and release three coloured bursts, and those bursts then gather into the source cloud at the top of
 * the cascade (Scene 2). It never remounts at a scene boundary: it simply keeps following the global timeline.
 */
/** Position on the timeline from which the mass is gone (it has shrunk away by the end of Scene 1). */
export const CELLS_GONE_G = 2.02;

export function TumorStage({ reducedMotion = false }: TumorStageProps) {
  const framing = useFraming();
  const theme = useAppStore((s) => s.theme);
  const light = theme === 'light';
  const getG = useGetG(reducedMotion);
  const cells = useMemo(() => getTumorMassLayout(), []);

  // Cells as the camera sees them while the wave sweeps: rotated to the angle the mass holds from Scene 1 on.
  const worldCells = useMemo(() => rotateLayout(cells, massRotation(1)), [cells]);
  const sweepDistance = (framing.keepFullFraming ? 1 : CYTOLYSIS_CAMERA_PATH[0].distance) * framing.massDistance;
  const waveCoords = useMemo(() => worldCells.map((c) => waveCoordinate(c.position, sweepDistance)), [worldCells, sweepDistance]);

  // Dragging the bar overrides scroll-derived progress so it sits exactly under the pointer; the scroll position is
  // moved to match, so everything else follows, and releasing never jumps.
  const drag = useRef(new DragOverride()).current;
  const getLocal1 = useCallback(() => drag.resolve(localProgress(getG(), 1)), [drag, getG]);
  const grabOffset = useRef(0);
  const dragTo = useCallback(
    (pointerX: number) => {
      const progress = arrivalProgress(pointerX + grabOffset.current);
      drag.move(progress);
      useAppStore.getState().scrollApi?.scrollToSceneProgress(1, progress);
    },
    [drag],
  );
  useEffect(() => {
    const cancel = () => drag.cancel();
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchmove', cancel, { passive: true });
    return () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    };
  }, [drag]);

  const spin = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!spin.current) return;
    const g = getG();
    spin.current.rotation.y = massRotation(g) + (reducedMotion ? 0 : idleSway(g, clock.elapsedTime));
    // Once Scene 1 is over the cells have shrunk away; skipping the draw saves ~49k triangles a frame on the standard tier
    // and ~180k on the high one for the rest of the experience.
    spin.current.visible = g < CELLS_GONE_G;
  });

  const velocities = useMemo(
    () => Object.fromEntries(SYSTEMS.map((id) => [id, buildParticleVelocities(cells.length, PARTICLE_SYSTEM_SEEDS[id])])) as Record<ParticleSystemId, Float32Array>,
    [cells],
  );
  const cloudTargets = useMemo(
    () => Object.fromEntries(SYSTEMS.map((id) => [id, buildCloudTargets(cells.length * PARTICLES.perCellPerSystem, PARTICLE_SYSTEM_SEEDS[id] + 7)])) as Record<ParticleSystemId, Float32Array>,
    [cells],
  );
  // Particles only change between the start of Scene 1 and the end of the hand-over (the end of Scene 1), so outside that
  // range the key is constant and the 18,000-point buffers are not rewritten.
  const particleKey = useCallback(() => Math.min(Math.max(getG(), 0.99), 2), [getG]);

  const placeholder = <PlaceholderCells instances={cells} waveCoords={waveCoords} getLocal={getLocal1} />;

  return (
    <>
      <group ref={spin}>
        <ModelBoundary fallback={placeholder} errorFallback={placeholder}>
          <CellMass instances={cells} waveCoords={waveCoords} getLocal={getLocal1} reducedMotion={reducedMotion} />
        </ModelBoundary>
      </group>

      <Wavefront
        getX={() => waveX(getLocal1())}
        getOpacity={() => waveOpacity(getLocal1())}
        blend={light ? 'normal' : 'additive'}
        color={light ? [0.86, 0.5, 0.1] : undefined}
        draggable
        onDragStart={(x) => {
          grabOffset.current = waveX(getLocal1()) - x;
          drag.start(getLocal1());
          dragTo(x);
        }}
        onDrag={dragTo}
        onDragEnd={() => drag.end()}
      />

      {SYSTEMS.map((id) => (
        <ParticleBurst
          key={id}
          count={cells.length * PARTICLES.perCellPerSystem}
          color={moleculeColor(id, theme)}
          getProgress={particleKey}
          blend={light ? 'normal' : 'additive'}
          fill={(positions, colors, rgb, key, stride) =>
            fillParticleBuffers(positions, colors, worldCells, waveCoords, velocities[id], rgb, localProgress(key, 1), stride, {
              targets: cloudTargets[id],
              keepEvery: CLOUD_KEEP_EVERY,
              amount: cloudTransition(key),
            })
          }
        />
      ))}
    </>
  );
}
