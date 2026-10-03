import { sampleCameraPath } from './cameraPath';
import { CYTOLYSIS_CAMERA_PATH } from './cytolysis';

/**
 * The whole experience as one continuous timeline. `g` is "scene units": 0 is the start of Scene 0, 1 the start of
 * Scene 1, 2.5 halfway through Scene 2, and so on. Everything in 3D is a pure function of `g` (plus the clock for
 * ambient motion), so scenes hand over to each other with no cut: the same cells, one camera, one set of particles.
 */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Progress within scene `index` (0–1, clamped outside it). */
export function localProgress(g: number, index: number): number {
  return clamp01(g - index);
}

// ---------------------------------------------------------------- the tumor mass (Scenes 0–1)

/** How far the mass has turned by the end of Scene 0 (radians). It turns with the scroll, then holds still for the wave. */
export const MASS_TURN = 1.15;
const MASS_START_ANGLE = 0.35;

/** Deterministic rotation of the mass about the vertical axis; constant from the start of Scene 1 on. */
export function massRotation(g: number): number {
  return MASS_START_ANGLE + MASS_TURN * smooth(clamp01(g));
}

/**
 * Idle sway added to the rotation while resting in Scene 0 (time-driven), fading to nothing by the end of the scene
 * so the hand-over to Scene 1 has no step.
 */
export function idleSway(g: number, time: number): number {
  const fade = 1 - smooth(clamp01((g - 0.75) / 0.25));
  return 0.12 * Math.sin(time * 0.35) * fade;
}

// ---------------------------------------------------------------- the cascade (Scene 2)

/** Scene 2 is built around its own origin (source cloud at the top); this places it so that origin is the world origin. */
export const SCENE2_OFFSET: [number, number, number] = [0, -4.3, 0];

/**
 * The hand-over from Scene 1 to Scene 2 happens at the END of Scene 1, so that every scene start already looks like its
 * scene (a deep link or nav click to Scene 2 lands on the cascade, not on a cloud that is still travelling). It runs
 * over the last stretch of Scene 1: the burst particles contract into the source cloud and the camera flies down to
 * frame the cascade.
 */
export const CLOUD_SPAN = 0.14;
export const CLOUD_START = 2 - CLOUD_SPAN;

/** 0 → 1 as Scene 1's particle cloud contracts into Scene 2's source cloud. */
export function cloudTransition(g: number): number {
  return smooth(clamp01((g - CLOUD_START) / CLOUD_SPAN));
}

/** Fade-in of the cascade's static props (heart, kidney, pool, labels) as the camera arrives. */
export function cascadePresence(g: number): number {
  return smooth(clamp01((g - (CLOUD_START + 0.04)) / 0.1));
}

// ---------------------------------------------------------------- camera

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface CameraContext {
  /** Distance that frames the tumor mass (Scenes 0–1) for this aspect ratio. */
  massDistance: number;
  /** Distance that frames the whole cascade for this aspect ratio. */
  cascadeDistance: number;
  /** Where the camera looks while framing the cascade, in world units. */
  cascadeTargetY: number;
  /** Narrow or shifted layouts keep the full mass framing instead of pushing in. */
  keepFullFraming: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Closest approach to the mass: where the Scene 1 path starts, and where Scene 0's slow push-in ends. */
const PUSH_IN = CYTOLYSIS_CAMERA_PATH[0].distance;

export function cameraPoseAt(g: number, ctx: CameraContext): CameraPose {
  const floor = ctx.keepFullFraming ? 1 : 0;
  // Scenes 0–1: the mass. A slow push-in at the end of Scene 0 meets the Scene 1 path, so there is no jump.
  let factor: number;
  let y: number;
  let fov: number;
  if (g < 1) {
    factor = lerp(1, Math.max(floor, PUSH_IN), smooth(clamp01((g - 0.7) / 0.3)));
    y = 0;
    fov = 50;
  } else {
    // The Scene 1 path (hold through the wave, then pull back) is compressed into the part of Scene 1 before the hand-over.
    const s = sampleCameraPath(CYTOLYSIS_CAMERA_PATH, clamp01((g - 1) / (CLOUD_START - 1)));
    factor = Math.max(floor, s.distance);
    y = s.y;
    fov = s.fov;
  }
  const mass: CameraPose = {
    position: [0, y * ctx.massDistance * 0.1, factor * ctx.massDistance],
    target: [0, 0, 0],
    fov,
  };
  if (g <= CLOUD_START) return mass;

  // End of Scene 1: the pull-back flows into the cascade framing as the particles gather at the source.
  const end = cameraPoseAt(CLOUD_START, ctx);
  const k = cloudTransition(g);
  const ty = ctx.cascadeTargetY;
  return {
    position: [0, lerp(end.position[1], ty, k), lerp(end.position[2], ctx.cascadeDistance, k)],
    target: [0, lerp(end.target[1], ty, k), 0],
    fov: lerp(end.fov, 50, k),
  };
}
