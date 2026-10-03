import type { ModelManifest } from '../schema';

/**
 * TLS model files (public/models). Only scenes that exist today are listed; later scenes add entries as their
 * models get wired in. `high` points at the HD tier (same file names under models/hd/).
 *
 * The 200-cell tumor mass is instanced, so it always resolves to a light file even on the high tier: the HD cell
 * is ~5k triangles × 200 = ~1M, against the 50k-per-scene budget (asset pipeline §9).
 */
export const tlsModels: ModelManifest = {
  basePath: 'models/',
  version: '1',
  models: {
    cell: {
      standard: 's0_cell_base_tex.glb',
      high: 'hd/s0_cell_base.glb',
      lod: 's0_cell_base_lod1.glb',
      scenes: [0, 1],
      usages: ['instanced'],
    },
    cellRupture: {
      standard: 's1_cell_rupture.glb',
      high: 'hd/s1_cell_rupture.glb',
      lod: 's1_cell_rupture_lod1.glb',
      scenes: [1],
      usages: ['instanced'],
    },
  },
};
