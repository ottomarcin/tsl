import { Color, type MeshStandardMaterial } from 'three';

/** Asset spec §1.5: cells and organic geometry carry a small emissive component (~0.05) so they look slightly self-luminous. */
export const SELF_LUMINANCE = 0.05;

/**
 * Lifts a faint emissive material so its brightest channel reaches `target`. The exported files carry the spec's
 * emission (colour × 0.03–0.08), far below 0.05 in glTF units, so without this they read as black. Materials with no
 * emission, or already at least that bright, are left alone.
 */
export function liftEmissive(material: MeshStandardMaterial, target = SELF_LUMINANCE): void {
  if (target <= 0) return;
  const peak = Math.max(material.emissive.r, material.emissive.g, material.emissive.b) * material.emissiveIntensity;
  if (peak > 0 && peak < target) material.emissiveIntensity *= target / peak;
}

const scratchColor = new Color();

/** A material's resting emissive, captured once so glows can be computed from it every frame without compounding. */
export interface EmissiveRest {
  color: Color;
  intensity: number;
}

export function captureEmissive(material: MeshStandardMaterial): EmissiveRest {
  return { color: material.emissive.clone(), intensity: material.emissiveIntensity };
}

/**
 * Sets the material's emissive to its resting glow scaled by `1 + boost`, plus `amount` of `glow`, always starting
 * from the rest state. (Lifted materials have large intensity multipliers on near-black colours, so lerping their
 * colour toward a bright one would blow out; the result is folded into the colour and the intensity reset to 1.)
 */
export function applyGlow(material: MeshStandardMaterial, rest: EmissiveRest, glow: Color, amount: number, boost = 0): void {
  material.emissiveIntensity = 1;
  material.emissive.copy(rest.color).multiplyScalar(rest.intensity * (1 + boost));
  material.emissive.add(scratchColor.copy(glow).multiplyScalar(amount));
}
