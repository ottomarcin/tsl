import { createContext, useContext } from 'react';
import type { CameraContext } from '../../lib/timeline';

/**
 * Camera framing numbers for the current screen, computed once by the Experience and read by the scenes that need to
 * know how far away the camera is (the wavefront's perspective correction) without owning the camera.
 */
export const FramingContext = createContext<CameraContext>({
  massDistance: 14,
  cascadeDistance: 12.5,
  cascadeTargetY: -5.4,
  keepFullFraming: false,
});

export function useFraming(): CameraContext {
  return useContext(FramingContext);
}
