import type { ModelManifest } from '../schema';

/** Inside to outside: the membrane is translucent and wraps everything else, so it draws last. */
const CELL_DRAW_ORDER = ['nucleoli', 'nucleus', 'vacuoles', 'membrane'];

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
    // The plain cell. The scenes draw the rupture cell instead (its rest pose is this cell, and one model for Scenes 0
    // and 1 means nothing swaps at the boundary), so this is no longer preloaded; it stays for the model gallery.
    cell: {
      standard: 's0_cell_base_tex.glb',
      high: 'hd/s0_cell_base.glb',
      lod: 's0_cell_base_lod1.glb',
      drawOrder: CELL_DRAW_ORDER,
      scenes: [],
      usages: ['instanced'],
    },
    heartIcon: {
      standard: 's2_heart_icon.glb',
      high: 'hd/s2_heart_icon.glb',
      scenes: [2],
      usages: ['single'],
    },
    kidney: {
      standard: 's2_kidney_silhouette.glb',
      high: 'hd/s2_kidney_silhouette.glb',
      scenes: [2],
      usages: ['single'],
    },
    waypoint: {
      standard: 's2_waypoint_node.glb',
      high: 'hd/s2_waypoint_node.glb',
      scenes: [2],
      usages: ['single'],
    },
    xoEnzyme: {
      standard: 's2_XO_enzyme.glb',
      high: 'hd/s2_XO_enzyme.glb',
      scenes: [2],
      usages: ['single'],
    },
    // 15-20 copies each, tiny: the light files are plenty on every tier.
    crystalCaPhos: {
      standard: 's2_crystal_caphos.glb',
      scenes: [2],
      usages: ['instanced'],
    },
    crystalUricAcid: {
      standard: 's2_crystal_uricacid.glb',
      scenes: [2],
      usages: ['instanced'],
    },
    cellRupture: {
      standard: 's1_cell_rupture.glb',
      high: 'hd/s1_cell_rupture.glb',
      lod: 's1_cell_rupture_lod1.glb',
      drawOrder: CELL_DRAW_ORDER,
      scenes: [0, 1],
      usages: ['instanced'],
    },
  },
};
