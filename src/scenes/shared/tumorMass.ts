import { generateMassLayout, type MassInstance } from '../../lib/massLayout';

/** Asset spec §2.2: ~200 cells, gaussian σ 1.5, min spacing 0.7. Fixed seed so the mass is identical on every load and in every scene. */
export const TUMOR_MASS_OPTIONS = { count: 200, sigma: 1.5, minSpacing: 0.7, seed: 20240719 } as const;

let cached: MassInstance[] | null = null;

/** The shared tumor mass layout, computed once (Scenes 0 and 1 show the same cells). */
export function getTumorMassLayout(): MassInstance[] {
  cached ??= generateMassLayout(TUMOR_MASS_OPTIONS);
  return cached;
}
