import { sampleCameraPath } from './cameraPath';
import { KIDNEY_POS } from './cascadePositions';
import { CYTOLYSIS_CAMERA_PATH } from './cytolysis';

/**
 * The whole experience as one continuous timeline. `g` is "scene units": 0 is the start of Scene 0, 1 the start of
 * Scene 1, 2.5 halfway through Scene 2, and so on. Everything in 3D is a pure function of `g` (plus the clock for
 * ambient motion), so scenes hand over to each other with no cut: the same cells, one camera, one set of particles.
 */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
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
  const fadeIn = smooth(clamp01((g - (CLOUD_START + 0.04)) / 0.1));
  // ...and out again while the camera dives into the kidney and the tubule takes its place.
  const fadeOut = smooth(clamp01((g - CASCADE_FADE_START) / (CASCADE_FADE_END - CASCADE_FADE_START)));
  // ...and back in at the end of Scene 4, when the story rewinds to T+0 (Scene 5).
  const rewindIn = smooth(clamp01((g - (REWIND_START + 0.04)) / 0.1));
  return fadeIn * (1 - fadeOut) + rewindIn;
}

// ---------------------------------------------------------------- the nephron (Scene 3)

/**
 * The dive into the kidney, over the end of Scene 2 (so `g = 3` already is Scene 3). First the camera pushes in on the
 * kidney until it fills the frame; then the tubule appears inside it, small, and grows to full size while the camera
 * settles back to frame it. The tubule is centred on the kidney, so it is literally "inside" it.
 */
export const TUBULE_SPAN = 0.2;
export const TUBULE_START = 3 - TUBULE_SPAN;
/** Fractions of the dive: the push-in ends and the tubule's growth begins. */
const DIVE_IN = 0.55;
const GROW_START = 0.4;

/** World position of the kidney (and so of the tubule's centre). */
export const SCENE3_OFFSET: [number, number, number] = [SCENE2_OFFSET[0] + KIDNEY_POS[0], SCENE2_OFFSET[1] + KIDNEY_POS[1], 0];
/** The camera looks a little below the tubule's centre, which lifts it clear of the step caption in the lower left. */
export const TUBULE_LOOK_DY = -0.5;
/** Camera distance when the kidney fills the frame. */
export const KIDNEY_ZOOM_DISTANCE = 6.2;
/** Size of the tubule (relative to full) at the moment it appears inside the kidney. */
export const TUBULE_BIRTH_SCALE = 0.14;

const CASCADE_FADE_START = TUBULE_START + 0.5 * TUBULE_SPAN;
const CASCADE_FADE_END = TUBULE_START + 0.82 * TUBULE_SPAN;

function dive(g: number): number {
  return clamp01((g - TUBULE_START) / TUBULE_SPAN);
}

/** Progress of the whole dive, 0 → 1. */
export function tubuleTransition(g: number): number {
  return smooth(dive(g));
}

/** How big the tubule is, as a fraction of its final size: tiny inside the kidney, then growing as the camera settles. */
export function tubuleScale(g: number): number {
  return lerp(TUBULE_BIRTH_SCALE, 1, smooth(clamp01((dive(g) - GROW_START) / (1 - GROW_START))));
}

/** Fade-in of the tubule's materials, once the kidney fills the frame, and out again as Scene 4's panels take over. */
export function tubulePresence(g: number): number {
  const fadeIn = smooth(clamp01((dive(g) - 0.45) / 0.3));
  const fadeOut = smooth(clamp01((g - SYSTEMIC_START - 0.01) / 0.09));
  return fadeIn * (1 - fadeOut);
}

// ---------------------------------------------------------------- the systemic panels (Scene 4)

/** Over the end of Scene 3 the tubule fades out, the camera pulls back and the heart and hand panels fade in. */
export const SYSTEMIC_SPAN = 0.14;
export const SYSTEMIC_START = 4 - SYSTEMIC_SPAN;
/** Scene 4 is built around the same point as the tubule, so the hand-over is a cross-fade in place. */
export const SCENE4_OFFSET: [number, number, number] = [SCENE2_OFFSET[0] + KIDNEY_POS[0], SCENE2_OFFSET[1] + KIDNEY_POS[1], 0];

export function systemicTransition(g: number): number {
  return smooth(clamp01((g - SYSTEMIC_START) / SYSTEMIC_SPAN));
}

/** Fade-in of the panels' materials as the camera settles. */
export function systemicPresence(g: number): number {
  const fadeIn = smooth(clamp01((g - (SYSTEMIC_START + 0.05)) / 0.08));
  // The panels give way to the cascade again as Scene 5 rewinds.
  const fadeOut = smooth(clamp01((g - REWIND_START) / 0.1));
  return fadeIn * (1 - fadeOut);
}

// ---------------------------------------------------------------- the rewind (Scene 5)

/**
 * Over the end of Scene 4 the panels fade out and the camera climbs back to the cascade's framing, which returns at
 * its T+0 state (`g = 5` already is Scene 5). The cascade and the panels live at different heights, so the camera
 * covers the distance between them.
 */
export const REWIND_SPAN = 0.14;
export const REWIND_START = 5 - REWIND_SPAN;

export function rewindTransition(g: number): number {
  return smooth(clamp01((g - REWIND_START) / REWIND_SPAN));
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
  /** Distance that frames the nephron tubule in Scene 3. */
  tubuleDistance: number;
  /** Distance and aim (world y) that frame the heart and hand panels in Scene 4. */
  systemicDistance: number;
  systemicTargetY: number;
  /** Narrow or shifted layouts keep the full mass framing instead of pushing in. */
  keepFullFraming: boolean;
}

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
  const cascade: CameraPose = {
    position: [0, lerp(end.position[1], ty, k), lerp(end.position[2], ctx.cascadeDistance, k)],
    target: [0, lerp(end.target[1], ty, k), 0],
    fov: lerp(end.fov, 50, k),
  };
  if (g <= TUBULE_START) return cascade;

  // End of Scene 2: push in on the kidney until it fills the frame...
  const kidneyY = SCENE3_OFFSET[1];
  const u = dive(g);
  const push = smooth(clamp01(u / DIVE_IN));
  const settle = smooth(clamp01((u - DIVE_IN) / (1 - DIVE_IN)));
  // ...then settle back to frame the tubule growing inside it, and creep slightly closer through Scene 3.
  const creep = 1 - 0.08 * smooth(clamp01(g - 3));
  const targetY = lerp(lerp(cascade.target[1], kidneyY, push), kidneyY + TUBULE_LOOK_DY, settle);
  const distance = lerp(lerp(cascade.position[2], KIDNEY_ZOOM_DISTANCE, push), ctx.tubuleDistance * creep, settle);
  const tube: CameraPose = { position: [0, targetY, distance], target: [0, targetY, 0], fov: 50 };
  if (g <= SYSTEMIC_START) return tube;

  // End of Scene 3: the camera moves to frame the two panels (same spot, a different framing) as they cross-fade in.
  const rest = cameraPoseAt(SYSTEMIC_START, ctx);
  const m = systemicTransition(g);
  const sy = ctx.systemicTargetY;
  const panels: CameraPose = {
    position: [0, lerp(rest.position[1], sy, m), lerp(rest.position[2], ctx.systemicDistance, m)],
    target: [0, lerp(rest.target[1], sy, m), 0],
    fov: 50,
  };
  if (g <= REWIND_START) return panels;

  // End of Scene 4: climb back to the cascade's framing for the rewind.
  const r = rewindTransition(g);
  return {
    position: [0, lerp(panels.position[1], ctx.cascadeTargetY, r), lerp(panels.position[2], ctx.cascadeDistance, r)],
    target: [0, lerp(panels.target[1], ctx.cascadeTargetY, r), 0],
    fov: 50,
  };
}
