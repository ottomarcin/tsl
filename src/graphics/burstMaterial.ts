import type { Material, MeshStandardMaterial } from 'three';

/** Geometry attribute holding the 0–1 "where the membrane tears" mask (exported as `_BURST`, renamed on load). */
export const BURST_MASK_ATTRIBUTE = 'burstMask';
/** Per-instance 0–1 rupture amount. */
export const BURST_AMOUNT_ATTRIBUTE = 'instBurst';

/**
 * Makes the membrane tear: fragments whose burst mask exceeds a threshold that falls as the instance's rupture
 * amount rises are discarded, opening a hole on the bulge side (asset brief `s1_cell_rupture`: "the hole is opened by
 * the app shader using _BURST"). At rupture 0 nothing is discarded.
 */
export function patchBurstMaterial(material: MeshStandardMaterial): MeshStandardMaterial {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float ${BURST_MASK_ATTRIBUTE};
         attribute float ${BURST_AMOUNT_ATTRIBUTE};
         varying float vBurstMask;
         varying float vBurstAmount;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vBurstMask = ${BURST_MASK_ATTRIBUTE};
         vBurstAmount = ${BURST_AMOUNT_ATTRIBUTE};`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying float vBurstMask;
         varying float vBurstAmount;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         if (vBurstMask > 1.02 - vBurstAmount * 0.92) discard;`,
      );
  };
  material.customProgramCacheKey = () => 'tls-burst-v1';
  return material;
}

export function isStandardMaterial(m: Material): m is MeshStandardMaterial {
  return (m as MeshStandardMaterial).isMeshStandardMaterial === true;
}
