import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

const FOV_HALF_TAN = Math.tan((50 / 2) * (Math.PI / 180));
/** Radius of the mass plus margin for UI overlays. */
const FRAME_RADIUS = 6.2;

/** Camera distance that keeps the whole mass inside both the vertical and horizontal field of view. */
export function cameraDistanceFor(aspect: number): number {
  return Math.max(14, FRAME_RADIUS / (FOV_HALF_TAN * Math.min(1, aspect)));
}

/**
 * Applies the screen-shift for layouts with a left caption column and returns the base camera distance for the
 * current aspect ratio. Resets the view offset on unmount so the next scene starts clean.
 */
export function useSceneFraming(viewShift: number): number {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const aspect = width / Math.max(1, height);

  useEffect(() => {
    if (viewShift) camera.setViewOffset(width, height, -viewShift * width, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, width, height, viewShift]);

  return cameraDistanceFor(aspect);
}
