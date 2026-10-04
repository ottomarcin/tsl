import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Quaternion, Vector3, type Group } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { PathLine } from '../../graphics/PathLine';
import { applyGlow, captureEmissive } from '../../graphics/emissive';
import { buildPathLut, lutPoint, type Vec3 } from '../../lib/cascade';
import { feedbackStrength } from '../../lib/renal';
import { useModelClone } from '../Scene2/useModelClone';
import type { Scene3Getters } from './shared';
import { token } from '../../lib/tokens';

export interface FeedbackLoopProps extends Scene3Getters {
  color: string;
  blend: 'additive' | 'normal';
  caption: string;
}

/**
 * From the underside of the injured tubule, round and down toward the lab strip below the scene, ending in an arrowhead
 * beside the caption (scene space, not tubule space). Placed in the free space below the tubule, clear of the step
 * caption on the left and the afferent arteriole on the right.
 */
const LOOP: Vec3[] = [
  [-0.6, -1.0, 0],
  [-1.3, -1.9, 0],
  [-0.9, -3.0, 0],
  [0.6, -3.45, 0],
];
const RED = new Color(token('--flag-red'));

/**
 * The vicious cycle (step 3.4): a red trail looping from the injured tubule back toward the labs, with an arrowhead and
 * a caption. It fades in with the step and pulses gently (alpha 0.6 → 0.9 over 1.5 s).
 */
export function FeedbackLoop({ color, blend, caption, getProgress, getPresence, reducedMotion }: FeedbackLoopProps) {
  const lut = useMemo(() => buildPathLut(LOOP, 64), []);
  const { root, materials } = useModelClone('feedbackArrow');
  const head = useRef<Group>(null);
  const rest = useRef(materials.map(captureEmissive));
  const pulse = useRef(1);

  const { end, quat } = useMemo(() => {
    const a = lutPoint(lut, 0.97, [0, 0, 0]);
    const b = lutPoint(lut, 1, [0, 0, 0]);
    const dir = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    return { end: b, quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir) };
  }, [lut]);

  useFrame(({ clock }) => {
    const k = feedbackStrength(getProgress()) * getPresence();
    pulse.current = reducedMotion ? 0.85 : 0.75 + 0.15 * Math.sin((2 * Math.PI * clock.elapsedTime) / 1.5);
    if (head.current) {
      head.current.visible = k > 0.01;
      head.current.scale.setScalar(2.6 * k);
    }
    materials.forEach((m, i) => {
      m.transparent = true;
      m.opacity = k * pulse.current;
      applyGlow(m, rest.current[i], RED, 0.2 * k, 0);
    });
  });

  return (
    <>
      <PathLine
        lut={lut}
        color={color}
        getReveal={() => feedbackStrength(getProgress())}
        getEmphasis={() => pulse.current}
        getPresence={getPresence}
        showBase={false}
        dashed={false}
        blend={blend}
      />
      <group ref={head} position={end} quaternion={quat.toArray() as [number, number, number, number]} visible={false}>
        <primitive object={root} />
      </group>
      <ScenePointLabel
        position={[2.7, -3.45, 0]}
        text={caption}
        color="var(--flag-red)"
        large
        getOpacity={() => feedbackStrength(getProgress()) * getPresence()}
      />
    </>
  );
}
