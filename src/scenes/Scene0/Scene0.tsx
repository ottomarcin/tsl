import { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { ModelBoundary } from '../../assets/ModelBoundary';
import { InstancedMass } from '../../graphics/InstancedMass';
import { CellMass } from './CellMass';
import { getTumorMassLayout, TUMOR_MASS_OPTIONS } from '../shared/tumorMass';
import { useSceneFraming } from '../shared/useSceneFraming';

export { TUMOR_MASS_OPTIONS };

export interface Scene0Props {
  reducedMotion?: boolean;
  /** Shifts the rendered image right by this fraction of the canvas width (room for a left caption column). */
  viewShift?: number;
}

/**
 * Scene 0 3D content: the tumor mass drawn from the cell model (placeholder icosahedra while it loads or if it
 * fails); the layout is the real baked-once s0_tumor_mass algorithm. Chips and badge are DOM
 * overlays owned by the app shell, not part of the canvas.
 */
export function Scene0({ reducedMotion = false, viewShift = 0 }: Scene0Props) {
  const instances = useMemo(() => getTumorMassLayout(), []);
  const camera = useThree((s) => s.camera);
  const distance = useSceneFraming(viewShift);

  // Layout effect: runs before the first frame, so arriving from Scene 1 (pulled-back camera) never flashes it.
  useLayoutEffect(() => {
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    if (camera instanceof PerspectiveCamera && camera.fov !== 50) {
      camera.fov = 50;
      camera.updateProjectionMatrix();
    }
  }, [camera, distance]);

  // Stand-in shown while the model loads, and if it fails to load: the scene always has a tumor mass to show.
  const placeholder = (
    <InstancedMass instances={instances} reducedMotion={reducedMotion} pulseAmplitude={0.02} pulsePeriod={4.2} rotationSpeed={0.12}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial color="#5D4878" emissive="#2A2030" emissiveIntensity={0.3} roughness={0.6} transparent opacity={0.85} />
    </InstancedMass>
  );

  return (
    <ModelBoundary fallback={placeholder} errorFallback={placeholder}>
      <CellMass instances={instances} reducedMotion={reducedMotion} />
    </ModelBoundary>
  );
}
