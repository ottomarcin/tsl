import { useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { DevPlaceholderMesh } from './DevPlaceholderMesh';
import { cameraPoseAt, SCENE2_OFFSET, SCENE3_OFFSET, type CameraContext } from '../lib/timeline';
import { Scene2, CASCADE_EXTENT, CASCADE_LOOK_AT_Y } from '../scenes/Scene2/Scene2';
import { Scene3, TUBULE_EXTENT } from '../scenes/Scene3/Scene3';
import { FramingContext } from '../scenes/shared/framing';
import { cameraDistanceFor, cameraDistanceForExtent, useViewShift } from '../scenes/shared/useSceneFraming';
import { useGetG } from '../scenes/shared/useGetG';
import { TumorStage } from '../scenes/Tumor/TumorStage';
import { useAppStore } from '../store/useAppStore';

export interface ExperienceProps {
  viewShift?: number;
}

/**
 * The 3D world as one continuous piece. Instead of swapping a component per scene, the content of Scenes 0–2 stays
 * mounted (a scene is mounted from the one before it, so its models are ready when the camera arrives) and every part
 * follows the global timeline `g` from the scroll position, under one camera path. That is what removes the cuts:
 * the same cells run through Scenes 0 and 1, and Scene 1's particles fly up to become Scene 2's source cloud.
 */
export function Experience({ viewShift = 0 }: ExperienceProps) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const route = useAppStore((s) => s.route);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const getG = useGetG(reducedMotion);
  useViewShift(viewShift);

  const framing = useMemo<CameraContext>(
    () => ({
      massDistance: cameraDistanceFor(aspect),
      cascadeDistance: cameraDistanceForExtent(aspect, CASCADE_EXTENT),
      cascadeTargetY: CASCADE_LOOK_AT_Y + SCENE2_OFFSET[1],
      tubuleDistance: cameraDistanceForExtent(aspect, TUBULE_EXTENT),
      // "Slightly closer" than the full framing only where the mass still fits; narrow or shifted layouts keep it.
      keepFullFraming: aspect < 1.2 || viewShift > 0,
    }),
    [aspect, viewShift],
  );

  const place = () => {
    const pose = cameraPoseAt(getG(), framing);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    const perspective = camera as PerspectiveCamera;
    if (perspective.isPerspectiveCamera && Math.abs(perspective.fov - pose.fov) > 1e-4) {
      perspective.fov = pose.fov;
      perspective.updateProjectionMatrix();
    }
  };
  // Layout effect: the camera is on the path before the first frame, whichever scene the visitor lands in.
  useLayoutEffect(place, [camera, framing]);
  useFrame(place);

  const index = route.kind === 'scene' ? route.index : 0;
  const tumor = index <= 3;
  const cascade = index >= 1 && index <= 3;
  const nephron = index >= 2 && index <= 3;
  const placeholder = index >= 4;

  return (
    <FramingContext.Provider value={framing}>
      {tumor && <TumorStage reducedMotion={reducedMotion} />}
      {cascade && <Scene2 reducedMotion={reducedMotion} />}
      {nephron && <Scene3 reducedMotion={reducedMotion} />}
      {/* Scenes 4–5 have no 3D content yet (Epics 7–8): a stand-in where the camera rests. */}
      {placeholder && (
        <group position={SCENE3_OFFSET}>
          <DevPlaceholderMesh />
        </group>
      )}
    </FramingContext.Provider>
  );
}
