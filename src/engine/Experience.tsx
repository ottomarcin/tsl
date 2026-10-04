import { useCallback, useLayoutEffect, useMemo } from 'react';
import { FREE_PLAY_STEP, scene5Step } from '../lib/scene5';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { cameraPoseAt, SCENE2_OFFSET, SCENE4_OFFSET, type CameraContext } from '../lib/timeline';
import { Scene2, CASCADE_EXTENT, CASCADE_LOOK_AT_Y } from '../scenes/Scene2/Scene2';
import { Scene3, TUBULE_EXTENT } from '../scenes/Scene3/Scene3';
import { Scene4 } from '../scenes/Scene4/Scene4';
import { SYSTEMIC_LAYOUTS, layoutForAspect } from '../scenes/Scene4/layout';
import { FramingContext } from '../scenes/shared/framing';
import { cameraDistanceFor, cameraDistanceForExtent, useViewShift } from '../scenes/shared/useSceneFraming';
import { useGetG } from '../scenes/shared/useGetG';
import { TumorStage } from '../scenes/Tumor/TumorStage';
import { useAppStore } from '../store/useAppStore';
import { SCENE_COUNT } from '../store/types';

/** How far the picture moves aside for the Scene 5 panel, as a fraction of the canvas width. */
const PANEL_SHIFT = 0.17;

export interface ExperienceProps {
  viewShift?: number;
  /** Fraction of the canvas height the picture moves down, to clear a caption on top. */
  viewShiftY?: number;
}

/**
 * The 3D world as one continuous piece. Instead of swapping a component per scene, the content of Scenes 0–2 stays
 * mounted (a scene is mounted from the one before it, so its models are ready when the camera arrives) and every part
 * follows the global timeline `g` from the scroll position, under one camera path. That is what removes the cuts:
 * the same cells run through Scenes 0 and 1, and Scene 1's particles fly up to become Scene 2's source cloud.
 */
export function Experience({ viewShift = 0, viewShiftY = 0 }: ExperienceProps) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const route = useAppStore((s) => s.route);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const getG = useGetG(reducedMotion);
  // In free play (step 5.6) the intervention panel takes the right edge; the picture moves aside to stay clear of it.
  const panelOpen = useCallback(() => aspect >= 1.2 && getG() >= 5 && scene5Step(getG()) === FREE_PLAY_STEP && useAppStore.getState().route.kind === 'scene', [aspect, getG]);
  useViewShift(viewShift, () => (panelOpen() ? -PANEL_SHIFT : 0), viewShiftY);

  const framing = useMemo<CameraContext>(
    () => ({
      massDistance: cameraDistanceFor(aspect),
      cascadeDistance: cameraDistanceForExtent(aspect, CASCADE_EXTENT),
      cascadeTargetY: CASCADE_LOOK_AT_Y + SCENE2_OFFSET[1],
      tubuleDistance: cameraDistanceForExtent(aspect, TUBULE_EXTENT),
      systemicDistance: cameraDistanceForExtent(aspect, SYSTEMIC_LAYOUTS[layoutForAspect(aspect)].extent),
      systemicTargetY: SCENE4_OFFSET[1] + SYSTEMIC_LAYOUTS[layoutForAspect(aspect)].lookAtDy,
      // "Slightly closer" than the full framing only where the mass still fits; narrow or shifted layouts keep it.
      keepFullFraming: aspect < 1.2 || viewShift > 0 || viewShiftY > 0,
    }),
    [aspect, viewShift, viewShiftY],
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

  // Behind the end card the last scene is on screen.
  const index = route.kind === 'scene' ? route.index : route.kind === 'end' ? SCENE_COUNT - 1 : 0;
  // The cascade stays mounted to the end: Scene 5 brings it back.
  const cascade = index >= 1;
  const nephron = index >= 2 && index <= 3;
  // The panels are mounted from Scene 3 so their models are loaded when the camera arrives, and stay for the rest.
  const systemic = index >= 3;

  return (
    <FramingContext.Provider value={framing}>
      {/* Mounted throughout: the burst's remains are the cascade's source cloud, which Scene 5 shows again. */}
      <TumorStage reducedMotion={reducedMotion} />
      {cascade && <Scene2 reducedMotion={reducedMotion} />}
      {nephron && <Scene3 reducedMotion={reducedMotion} />}
      {systemic && <Scene4 reducedMotion={reducedMotion} layout={layoutForAspect(aspect)} />}
    </FramingContext.Provider>
  );
}
