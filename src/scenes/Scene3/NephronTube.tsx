import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, MeshStandardMaterial, Vector3 } from 'three';
import { MAX_LODGES, lodgedPoints, obstructionLevel, overlayStrength, type InflowCrystal } from '../../lib/renal';
import { useModelClone } from '../Scene2/useModelClone';
import type { Scene3Getters } from './shared';
import { token } from '../../lib/tokens';

export interface NephronTubeProps extends Scene3Getters {
  crystals: InflowCrystal[];
}

/** Shader uniforms shared with the inner wall material; updated every frame. */
interface WallUniforms {
  u_lodge: { value: Vector3[] };
  u_lodgeCount: { value: number };
  u_narrow: { value: number };
  u_falloff: { value: number };
  u_cyto: { value: number };
  u_vaso: { value: number };
}

const NARROW = 0.1;
const FALLOFF = 0.5;
const CYTO_RED = new Color(token('--flag-red'));

/**
 * Fragments on the camera's side of the tube's axis are discarded, so both the outer shell and the inner wall are cut
 * lengthwise and the far half is left open like a trough. (Tubule model space: the scene group turns the tube so its
 * local -X faces the camera.) A cut-away is what the "longitudinal section" label says it is.
 */
const CUT_VERTEX_DECL = `varying vec3 vCutPos;`;
const CUT_VERTEX_BODY = `vCutPos = position;`;
const CUT_FRAGMENT_DECL = `varying vec3 vCutPos;`;
const CUT_FRAGMENT_BODY = `if (vCutPos.x < 0.0) discard;`;

/** Cuts the outer shell open along the axis. */
export function patchOuterCut(material: MeshStandardMaterial): void {
  // With the near half cut away, what is left of the shell is seen from inside, i.e. its back faces, which a
  // single-sided material culls: the shell vanished. Draw both sides.
  material.side = DoubleSide;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${CUT_VERTEX_DECL}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${CUT_VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${CUT_FRAGMENT_DECL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${CUT_FRAGMENT_BODY}`);
  };
  material.customProgramCacheKey = () => 'tls-nephron-outer-cut-v1';
}

/**
 * Hooks the wall material up to the lodged crystals (asset spec `s3_lumen_narrow` / `s3_wall_states`): near each lodge
 * point the wall bulges toward the axis, and, depending on the overlay, glows red (direct cytotoxicity) or takes a
 * cool grey tint (reduced perfusion). Displacement is in the model's own space, with the axis along Z.
 */
export function patchWall(material: MeshStandardMaterial, uniforms: WallUniforms): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 u_lodge[${MAX_LODGES}];
         uniform int u_lodgeCount;
         uniform float u_narrow;
         uniform float u_falloff;
         varying vec3 vObj;
         varying vec3 vCutPos;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vObj = position;
         vCutPos = position;
         float bulge = 0.0;
         for (int i = 0; i < ${MAX_LODGES}; i++) {
           if (i >= u_lodgeCount) break;
           float w = clamp(1.0 - distance(position, u_lodge[i]) / u_falloff, 0.0, 1.0);
           bulge += w * w * (3.0 - 2.0 * w);
         }
         float radial = length(transformed.xy);
         if (radial > 1e-4) transformed.xy -= transformed.xy / radial * min(bulge, 1.0) * u_narrow;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 u_lodge[${MAX_LODGES}];
         uniform int u_lodgeCount;
         uniform float u_cyto;
         uniform float u_vaso;
         varying vec3 vObj;
         varying vec3 vCutPos;`,
      )
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
         if (vCutPos.x < 0.0) discard;`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float glow = 0.0;
         for (int i = 0; i < ${MAX_LODGES}; i++) {
           if (i >= u_lodgeCount) break;
           glow = max(glow, exp(-distance(vObj, u_lodge[i]) * 5.0));
         }
         totalEmissiveRadiance += vec3(0.85, 0.35, 0.19) * glow * u_cyto * 0.9;
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.35, 0.19), glow * u_cyto * 0.55);
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.44, 0.52), u_vaso * 0.35);`,
      );
  };
  material.customProgramCacheKey = () => 'tls-nephron-wall-v1';
}

/**
 * The nephron segment: translucent tube with an inner wall that narrows where crystals lodge and shows the chosen
 * injury overlay. Scene-space scale and orientation come from the parent group. Suspends while loading.
 */
export function NephronTube({ crystals, getProgress, getPresence, getMechanism }: NephronTubeProps) {
  const { root, materials } = useModelClone('nephron');
  const restOpacity = useRef(materials.map((m) => m.opacity));
  const uniforms = useMemo<WallUniforms>(
    () => ({
      u_lodge: { value: Array.from({ length: MAX_LODGES }, () => new Vector3()) },
      u_lodgeCount: { value: 0 },
      u_narrow: { value: NARROW },
      u_falloff: { value: FALLOFF },
      u_cyto: { value: 0 },
      u_vaso: { value: 0 },
    }),
    [],
  );
  const cyto = useRef(0);
  const vaso = useRef(0);

  useEffect(() => {
    // Only the inner wall carries the shader (the file has an outer and an inner material slot).
    materials.forEach((m) => (m.name.includes('inner') ? patchWall(m, uniforms) : patchOuterCut(m)));
  }, [materials, uniforms]);

  useFrame((_, delta) => {
    const p = getProgress();
    const mech = getMechanism();
    const strength = overlayStrength(p);
    const pts = lodgedPoints(crystals, p);
    pts.forEach((pt, i) => uniforms.u_lodge.value[i].set(pt[0], pt[1], pt[2]));
    uniforms.u_lodgeCount.value = pts.length;
    // Narrowing follows how obstructed the lumen is, so it eases in with the crystals.
    uniforms.u_narrow.value = NARROW * Math.min(1, 0.35 + obstructionLevel(crystals, p));
    // Overlays ease in/out over ~0.8 s.
    const k = Math.min(1, delta * 3.5);
    cyto.current += ((mech === 'cytotoxicity' ? strength : 0) - cyto.current) * k;
    vaso.current += ((mech === 'vasoconstriction' ? strength : 0) - vaso.current) * k;
    uniforms.u_cyto.value = cyto.current;
    uniforms.u_vaso.value = vaso.current;
    const presence = getPresence();
    root.visible = presence > 0.01;
    materials.forEach((m, i) => {
      m.transparent = true;
      m.opacity = restOpacity.current[i] * presence;
    });
  });

  return <primitive object={root} />;
}

export { CYTO_RED };
