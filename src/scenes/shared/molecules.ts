import type { Theme } from '../../store/types';
import { token } from '../../lib/tokens';

export type MoleculeId = 'K' | 'PO4' | 'purines' | 'Ca';

/** Asset spec molecule colours (`mol-*`); the light-theme token values are used on the pale canvas. */
export const MOLECULE_COLORS: Record<MoleculeId, { dark: string; light: string }> = {
  K: { dark: token('--mol-K', 'dark'), light: token('--mol-K', 'light') },
  PO4: { dark: token('--mol-PO4', 'dark'), light: token('--mol-PO4', 'light') },
  purines: { dark: token('--mol-purines', 'dark'), light: token('--mol-purines', 'light') },
  Ca: { dark: token('--mol-Ca', 'dark'), light: token('--mol-Ca', 'light') },
};

export function moleculeColor(id: MoleculeId, theme: Theme): string {
  return MOLECULE_COLORS[id][theme];
}
