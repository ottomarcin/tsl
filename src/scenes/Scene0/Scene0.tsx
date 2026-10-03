import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { InstancedMass } from '../../graphics/InstancedMass';
import { generateMassLayout } from '../../lib/massLayout';

/** Asset spec §2.2: ~200 cells, gaussian σ 1.5, min spacing 0.7. Fixed seed so the mass is identical on every load. */
export const TUMOR_MASS_OPTIONS = { count: 200, sigma: 1.5, minSpacing: 0.7, seed: 20240719 } as const;

const FOV_HALF_TAN = Math.tan((50 / 2) * (Math.PI / 180));
/** Radius of the mass plus margin for UI overlays. */
const FRAME_RADIUS = 6.2;

/** Camera distance that keeps the whole mass inside both the vertical and horizontal field of view. */
export function cameraDistanceFor(aspect: number): number {
  return Math.max(14, FRAME_RADIUS / (FOV_HALF_TAN * Math.min(1, aspect)));
}

export interface Scene0Props {
  reducedMotion?: boolean;
  /** Shifts the rendered image right by this fraction of the canvas width (room for a left caption column). */
  viewShift?: number;
}

/**
 * Scene 0 3D content. Placeholder geometry (low-poly icosahedra, spec membrane colours) standing in for
 * s0_cell_base.glb; the layout is the real baked-once s0_tumor_mass algorithm. Chips and badge are DOM
 * overlays owned by the app shell, not part of the canvas.
 */
export function Scene0({ reducedMotion = false, viewShift = 0 }: Scene0Props) {
  const instances = useMemo(() => generateMassLayout(TUMOR_MASS_OPTIONS), []);
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const aspect = width / Math.max(1, height);

  useEffect(() => {
    camera.position.set(0, 0, cameraDistanceFor(aspect));
    camera.lookAt(0, 0, 0);
    if (viewShift) camera.setViewOffset(width, height, -viewShift * width, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, aspect, width, height, viewShift]);

  return (
    <>
      <InstancedMass instances={instances} reducedMotion={reducedMotion} pulseAmplitude={0.02} pulsePeriod={4.2} rotationSpeed={0.12}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#5D4878" emissive="#2A2030" emissiveIntensity={0.3} roughness={0.6} transparent opacity={0.85} />
      </InstancedMass>
    </>
  );
}
