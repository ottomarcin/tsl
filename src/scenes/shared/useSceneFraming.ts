import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

const FOV_HALF_TAN = Math.tan((50 / 2) * (Math.PI / 180));
/** Radius of the tumor mass plus margin for UI overlays. */
const FRAME_RADIUS = 6.2;

/** Camera distance that keeps the whole tumor mass inside both the vertical and horizontal field of view. */
export function cameraDistanceFor(aspect: number): number {
  return Math.max(14, FRAME_RADIUS / (FOV_HALF_TAN * Math.min(1, aspect)));
}

export interface SceneExtent {
  /** Half the width and height of the region that must stay in view, in world units. */
  halfWidth: number;
  halfHeight: number;
}

/** Camera distance that fits a rectangular region of the z = 0 plane in both axes. */
export function cameraDistanceForExtent(aspect: number, { halfWidth, halfHeight }: SceneExtent): number {
  return Math.max(halfHeight / FOV_HALF_TAN, halfWidth / (FOV_HALF_TAN * Math.max(aspect, 0.1)));
}

/**
 * Applies the screen-shift for layouts with a left caption column (the image moves right by this fraction of the
 * canvas width). Resets on unmount so nothing later inherits it.
 */
export function useViewShift(viewShift: number): void {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    if (viewShift) camera.setViewOffset(width, height, -viewShift * width, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, width, height, viewShift]);
}
