/**
 * Where the parts of Scene 2's cascade sit, in the cascade's own coordinates. No three.js here on purpose: the timeline
 * and the page's own code need these numbers, and importing them must not pull the 3D library into the landing page.
 */
export type Vec3 = [number, number, number];

export const SOURCE_POS: Vec3 = [0, 4.3, 0];
export const HEART_POS: Vec3 = [-4, -2, 0];
export const POOL_CENTER: Vec3 = [-0.1, 0.3, 0];
export const POOL_RADIUS = 0.7;
export const CONVERGENCE_POS: Vec3 = [0, -3.0, 0];
/** Where crystals end up: well inside the kidney's upper part, so it reads as the destination, not a spot above it. */
export const KIDNEY_INLET: Vec3 = [0, -4.6, 0];
/** Centre of the kidney model (scaled 1.15 => ~3.5 tall). Its top (~-3.7) sits just below where the tubes meet. */
export const KIDNEY_POS: Vec3 = [0, -5.45, 0];
