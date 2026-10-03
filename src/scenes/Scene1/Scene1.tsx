import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { ParticleBurst } from '../../graphics/ParticleBurst';
import { Wavefront } from '../../graphics/Wavefront';
import { sampleCameraPath } from '../../lib/cameraPath';
import {
  CYTOLYSIS_CAMERA_PATH,
  PARTICLES,
  arrivalProgress,
  waveCoordinate,
  PARTICLE_SYSTEM_SEEDS,
  REDUCED_MOTION_PROGRESS,
  buildParticleVelocities,
  fillParticleBuffers,
  waveOpacity,
  waveX,
  type ParticleSystemId,
} from '../../lib/cytolysis';
import { DragOverride } from '../../lib/dragOverride';
import { stepIndexFromProgress } from '../../lib/steps';
import { useAppStore } from '../../store/useAppStore';
import { moleculeColor } from '../shared/molecules';
import { getTumorMassLayout } from '../shared/tumorMass';
import { useSceneFraming } from '../shared/useSceneFraming';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { RupturingMass } from './RupturingMass';
import { RupturingModelMass } from './RupturingModelMass';

export interface Scene1Props {
  reducedMotion?: boolean;
  viewShift?: number;
}

const SYSTEMS: { id: ParticleSystemId }[] = [{ id: 'K' }, { id: 'PO4' }, { id: 'purines' }];

const STEP_COUNT = 3;

/**
 * Scene 1 3D content: the Scene 0 mass, a wavefront sweeping across it, cells deforming and rupturing as it passes,
 * three particle bursts (K⁺ amber, PO₄ cyan, purines violet), then a camera pull-back. Cells come from
 * s1_cell_rupture.glb (shape keys + tear shader), with placeholders while it loads; the wavefront shader, particle
 * physics and camera path follow the asset spec.
 * Under reduced motion each step shows a still snapshot instead of animating.
 */
export function Scene1({ reducedMotion = false, viewShift = 0 }: Scene1Props) {
  const cells = useMemo(() => getTumorMassLayout(), []);
  const camera = useThree((s) => s.camera);
  const theme = useAppStore((st) => st.theme);
  const light = theme === 'light';
  const baseDistance = useSceneFraming(viewShift);
  const aspect = useThree((st) => st.size.width / Math.max(1, st.size.height));
  // "Slightly closer than Scene 0" only where the mass still fits; narrow or shifted layouts keep the full framing.
  const minDistance = aspect < 1.2 || viewShift > 0 ? 1 : 0;
  // Camera distance while the bar sweeps (the pull-back only starts near its end), for the perspective correction.
  const sweepDistance = Math.max(minDistance, CYTOLYSIS_CAMERA_PATH[0].distance) * baseDistance;
  const waveCoords = useMemo(() => cells.map((c) => waveCoordinate(c.position, sweepDistance)), [cells, sweepDistance]);

  const velocities = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s.id, buildParticleVelocities(cells.length, PARTICLE_SYSTEM_SEEDS[s.id])])) as Record<ParticleSystemId, Float32Array>,
    [cells],
  );

  // Dragging the wavefront overrides scroll-derived progress so the bar sits exactly under the pointer; the scroll
  // position is moved to match, so captions, labs and the camera follow and releasing never jumps.
  const drag = useRef(new DragOverride()).current;
  const getProgress = useCallback(() => {
    const raw = useAppStore.getState().sceneProgress;
    const base = reducedMotion ? REDUCED_MOTION_PROGRESS[stepIndexFromProgress(raw, STEP_COUNT)] : raw;
    return drag.resolve(base);
  }, [reducedMotion, drag]);

  // Where on the bar it was grabbed, so it doesn't snap its edge to the pointer.
  const grabOffset = useRef(0);
  const dragTo = useCallback(
    (pointerX: number) => {
      const progress = arrivalProgress(pointerX + grabOffset.current);
      drag.move(progress);
      useAppStore.getState().scrollApi?.scrollToSceneProgress(1, progress);
    },
    [drag],
  );

  // Any scroll input hands control back to the scroll position.
  useEffect(() => {
    const cancel = () => drag.cancel();
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchmove', cancel, { passive: true });
    return () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    };
  }, [drag]);

  useFrame(() => {
    const p = getProgress();
    const s = sampleCameraPath(CYTOLYSIS_CAMERA_PATH, p);
    camera.position.set(0, s.y * baseDistance * 0.1, Math.max(minDistance, s.distance) * baseDistance);
    camera.lookAt(0, 0, 0);
    if (camera instanceof PerspectiveCamera && camera.fov !== s.fov) {
      camera.fov = s.fov;
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      {/* Stand-in while the model loads (and if it fails): stretched/swelling icosahedra with the same timing. */}
      <ModelBoundary
        fallback={<RupturingMass instances={cells} waveCoords={waveCoords} getProgress={getProgress} />}
        errorFallback={<RupturingMass instances={cells} waveCoords={waveCoords} getProgress={getProgress} />}
      >
        <RupturingModelMass instances={cells} waveCoords={waveCoords} getProgress={getProgress} />
      </ModelBoundary>
      <Wavefront
        getX={() => waveX(getProgress())}
        getOpacity={() => waveOpacity(getProgress())}
        blend={light ? 'normal' : 'additive'}
        color={light ? [0.86, 0.5, 0.1] : undefined}
        draggable
        onDragStart={(x) => {
          grabOffset.current = waveX(getProgress()) - x;
          drag.start(getProgress());
          dragTo(x);
        }}
        onDrag={dragTo}
        onDragEnd={() => drag.end()}
      />
      {SYSTEMS.map((sys) => (
        <ParticleBurst
          key={sys.id}
          count={cells.length * PARTICLES.perCellPerSystem}
          color={moleculeColor(sys.id, theme)}
          getProgress={getProgress}
          blend={light ? 'normal' : 'additive'}
          fill={(positions, colors, rgb, progress, stride) =>
            fillParticleBuffers(positions, colors, cells, waveCoords, velocities[sys.id], rgb, progress, stride)
          }
        />
      ))}
    </>
  );
}
