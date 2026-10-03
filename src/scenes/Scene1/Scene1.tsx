import { useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { ParticleBurst } from '../../graphics/ParticleBurst';
import { Wavefront } from '../../graphics/Wavefront';
import { sampleCameraPath } from '../../lib/cameraPath';
import {
  CYTOLYSIS_CAMERA_PATH,
  PARTICLES,
  PARTICLE_SYSTEM_SEEDS,
  REDUCED_MOTION_PROGRESS,
  buildParticleVelocities,
  fillParticleBuffers,
  waveOpacity,
  waveX,
  type ParticleSystemId,
} from '../../lib/cytolysis';
import { stepIndexFromProgress } from '../../lib/steps';
import { useAppStore } from '../../store/useAppStore';
import { getTumorMassLayout } from '../shared/tumorMass';
import { useSceneFraming } from '../shared/useSceneFraming';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { RupturingMass } from './RupturingMass';
import { RupturingModelMass } from './RupturingModelMass';

export interface Scene1Props {
  reducedMotion?: boolean;
  viewShift?: number;
}

/** Colours from the asset spec (`mol-K`, `mol-PO4`, `mol-purines`). */
const SYSTEMS: { id: ParticleSystemId; color: string }[] = [
  { id: 'K', color: '#E8A23D' },
  { id: 'PO4', color: '#4A9FD8' },
  { id: 'purines', color: '#9B6BD4' },
];

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
  const baseDistance = useSceneFraming(viewShift);
  const aspect = useThree((st) => st.size.width / Math.max(1, st.size.height));
  // "Slightly closer than Scene 0" only where the mass still fits; narrow or shifted layouts keep the full framing.
  const minDistance = aspect < 1.2 || viewShift > 0 ? 1 : 0;

  const velocities = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s.id, buildParticleVelocities(cells.length, PARTICLE_SYSTEM_SEEDS[s.id])])) as Record<ParticleSystemId, Float32Array>,
    [cells],
  );

  const getProgress = useCallback(() => {
    const raw = useAppStore.getState().sceneProgress;
    if (!reducedMotion) return raw;
    return REDUCED_MOTION_PROGRESS[stepIndexFromProgress(raw, STEP_COUNT)];
  }, [reducedMotion]);

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
        fallback={<RupturingMass instances={cells} getProgress={getProgress} />}
        errorFallback={<RupturingMass instances={cells} getProgress={getProgress} />}
      >
        <RupturingModelMass instances={cells} getProgress={getProgress} />
      </ModelBoundary>
      <Wavefront getX={() => waveX(getProgress())} getOpacity={() => waveOpacity(getProgress())} />
      {SYSTEMS.map((sys) => (
        <ParticleBurst
          key={sys.id}
          count={cells.length * PARTICLES.perCellPerSystem}
          color={sys.color}
          getProgress={getProgress}
          fill={(positions, colors, rgb, progress) =>
            fillParticleBuffers(positions, colors, cells, velocities[sys.id], rgb, progress)
          }
        />
      ))}
    </>
  );
}
