export interface CameraKeyframe {
  /** 0–1 progress within the scene. */
  progress: number;
  /** Multiplier on the scene's base camera distance. */
  distance: number;
  /** Vertical offset in scene units. */
  y: number;
  fov: number;
}

export interface CameraSample {
  distance: number;
  y: number;
  fov: number;
}

const ease = (t: number) => t * t * (3 - 2 * t);

/** Piecewise interpolation between keyframes with ease-in-out per segment (asset spec `s1_camera_path`). */
export function sampleCameraPath(keyframes: CameraKeyframe[], progress: number): CameraSample {
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (progress <= first.progress) return { distance: first.distance, y: first.y, fov: first.fov };
  if (progress >= last.progress) return { distance: last.distance, y: last.y, fov: last.fov };
  for (let i = 1; i < keyframes.length; i++) {
    const a = keyframes[i - 1];
    const b = keyframes[i];
    if (progress <= b.progress) {
      const span = b.progress - a.progress;
      const t = span === 0 ? 1 : ease((progress - a.progress) / span);
      return {
        distance: a.distance + (b.distance - a.distance) * t,
        y: a.y + (b.y - a.y) * t,
        fov: a.fov + (b.fov - a.fov) * t,
      };
    }
  }
  return { distance: last.distance, y: last.y, fov: last.fov };
}
