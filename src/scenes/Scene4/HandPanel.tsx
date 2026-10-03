import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, AnimationMixer, Color, DoubleSide, Material, type AnimationAction, type Group, type Mesh, type MeshStandardMaterial, type Object3D, type SkinnedMesh } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useModel } from '../../assets/useModel';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { tlsContent } from '../../content/tls';
import { liftEmissive } from '../../graphics/emissive';
import { MAX_PULSES, POSES, erraticLevel, nervePulses, panelFocus, poseWeights } from '../../lib/systemic';
import { HAND_CENTER_Y } from './layout';
import type { Scene4Getters } from './shared';

export interface HandPanelProps extends Scene4Getters {
  label: string;
  annotation: string;
}

const NERVE_GREEN = new Color('#5FBF8F');

/** Uniforms shared with the nerve material: where the travelling pulses are along the arm, and how bright. */
interface NerveUniforms {
  u_pulses: { value: number[] };
  u_pulseCount: { value: number };
  u_glow: { value: number };
}

/**
 * Nerve lines (asset spec `s4_nerve_pathway`): a faint green trail with bright pulses running elbow to fingertip. The
 * model's `uv.x` runs 0 at the elbow to 1 at the fingertip, so a pulse is just a bright band at one `uv.x`.
 */
export function patchNerves(material: MeshStandardMaterial, uniforms: NerveUniforms): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying float vNerveU;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvNerveU = uv.x;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vNerveU;\nuniform float u_pulses[${MAX_PULSES}];\nuniform int u_pulseCount;\nuniform float u_glow;`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float pulse = 0.0;
         for (int i = 0; i < ${MAX_PULSES}; i++) {
           if (i >= u_pulseCount) break;
           float d = (vNerveU - u_pulses[i]) / 0.07;
           pulse = max(pulse, exp(-d * d));
         }
         totalEmissiveRadiance = vec3(0.37, 0.75, 0.56) * (0.22 + 1.6 * pulse) * u_glow;`,
      );
  };
  material.customProgramCacheKey = () => 'tls-nerves-v1';
}

/**
 * The neuromuscular panel: a rigged forearm and hand that blends between the four authored poses as the scene moves
 * through step 4.3 (neutral → paresthesia → tetany → Trousseau's carpopedal spasm), with nerve pulses that fire
 * regularly at first and erratically as calcium falls. The poses are zero-length clips used as target poses: each is
 * held at its first frame and weighted. Dims while the cardiac panel is being discussed.
 */
export function HandPanel({ label, annotation, getProgress, getPresence, reducedMotion, spec }: HandPanelProps) {
  const gltf = useModel(tlsContent.models, 'hand', 'single');
  // A skinned model must be cloned with its skeleton rebound, or the clone would share bones with the cached copy.
  const { root, handMaterials, nerveMaterial, mixer, actions } = useMemo(() => {
    const root = cloneSkinned(gltf.scene) as Object3D;
    const handMaterials: MeshStandardMaterial[] = [];
    let nerveMaterial: MeshStandardMaterial | null = null;
    root.traverse((n) => {
      // (The wrist bone and the hand mesh are both "hand" in the file; the loader renames the bone "hand_1" and the
      // clips' tracks already address it that way, so the two never clash.)
      const mesh = n as SkinnedMesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      const own = (mesh.material as Material).clone() as MeshStandardMaterial;
      mesh.material = own;
      if (mesh.name === 'nerves') nerveMaterial = own;
      else {
        liftEmissive(own);
        handMaterials.push(own);
      }
    });
    const mixer = new AnimationMixer(root);
    const actions = Object.fromEntries(
      (gltf.animations ?? []).map((clip) => {
        const action = mixer.clipAction(clip);
        action.paused = true; // the clips are target poses (length ~0): hold the first frame and blend by weight
        action.setEffectiveWeight(0);
        return [clip.name, action];
      }),
    ) as Record<string, AnimationAction>;
    return { root, handMaterials, nerveMaterial: nerveMaterial as MeshStandardMaterial | null, mixer, actions };
  }, [gltf]);

  const group = useRef<Group>(null);
  const uniforms = useMemo<NerveUniforms>(() => ({ u_pulses: { value: new Array(MAX_PULSES).fill(0) }, u_pulseCount: { value: 0 }, u_glow: { value: 0 } }), []);
  const rest = useMemo(() => handMaterials.map((m) => m.opacity), [handMaterials]);
  const time = useRef(0);

  useEffect(() => {
    if (!nerveMaterial) return;
    patchNerves(nerveMaterial, uniforms);
    nerveMaterial.transparent = true;
    nerveMaterial.side = DoubleSide;
    nerveMaterial.depthWrite = false;
    nerveMaterial.blending = AdditiveBlending;
    nerveMaterial.color.copy(NERVE_GREEN).multiplyScalar(0.0);
    nerveMaterial.emissive.copy(NERVE_GREEN);
    nerveMaterial.emissiveIntensity = 1;
  }, [nerveMaterial, uniforms]);
  // Started in an effect, not when the mixer is created: React (strict mode) runs the cleanup below and then this again,
  // and an action that was stopped by a cleanup but only ever started at creation would stay dead.
  useEffect(() => {
    Object.values(actions).forEach((a) => a.play());
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, actions]);

  useFrame((_, delta) => {
    if (!reducedMotion) time.current += delta;
    const p = getProgress();
    const focus = panelFocus(p).hand * getPresence();
    if (group.current) group.current.visible = focus > 0.01;
    handMaterials.forEach((m, i) => {
      m.transparent = focus < 0.999;
      m.opacity = rest[i] * focus;
    });
    const weights = poseWeights(p);
    for (const pose of POSES) actions[pose]?.setEffectiveWeight(weights[pose]);
    mixer.update(0);
    // Nerve pulses: regular early, erratic as calcium falls. Still, evenly spaced under reduced motion.
    const pulses = reducedMotion ? [0.3, 0.7] : nervePulses(time.current, erraticLevel(p));
    pulses.forEach((v, i) => (uniforms.u_pulses.value[i] = v));
    uniforms.u_pulseCount.value = pulses.length;
    uniforms.u_glow.value = focus;
  });

  const [x, y] = spec.hand.position;
  const s = spec.hand.scale;
  const annotationOpacity = () => (getProgress() > 0.6 ? panelFocus(getProgress()).hand * getPresence() : 0);
  return (
    <>
      <group ref={group} position={[x, y - HAND_CENTER_Y * s, 0]} scale={s}>
        <primitive object={root} />
      </group>
      <ScenePointLabel position={[x, y - 2.65 * s, 0]} text={label} color="var(--text-secondary)" getOpacity={() => panelFocus(getProgress()).hand * getPresence()} />
      <ScenePointLabel position={[x - 2.1 * s, y + 0.2 * s, 0]} text={annotation} color="var(--flag-red)" large getOpacity={annotationOpacity} />
    </>
  );
}

export type { Mesh };
