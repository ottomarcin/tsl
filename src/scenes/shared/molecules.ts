import type { Theme } from '../../store/types';

export type MoleculeId = 'K' | 'PO4' | 'purines' | 'Ca';

/** Asset spec molecule colours (`mol-*`); the light-theme token values are used on the pale canvas. */
export const MOLECULE_COLORS: Record<MoleculeId, { dark: string; light: string }> = {
  K: { dark: '#E8A23D', light: '#B8771E' },
  PO4: { dark: '#4A9FD8', light: '#2A6A9D' },
  purines: { dark: '#9B6BD4', light: '#6C40A8' },
  Ca: { dark: '#D8D4C8', light: '#8A8678' },
};

export function moleculeColor(id: MoleculeId, theme: Theme): string {
  return MOLECULE_COLORS[id][theme];
}
