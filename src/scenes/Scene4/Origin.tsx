import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Group } from 'three';
import { FlowStream } from '../../graphics/FlowStream';
import { PathLine } from '../../graphics/PathLine';
import { buildPathLut, type Vec3 } from '../../lib/cascade';
import { criticalLevel, panelFocus, threadReach } from '../../lib/systemic';
import { useAppStore } from '../../store/useAppStore';
import { useModelClone } from '../Scene2/useModelClone';
import { useFade } from '../shared/useFade';
import type { Scene4Getters } from './shared';
import { token } from '../../lib/tokens';

const AMBER = new Color('#F0D8A0');
const RED = new Color(token('--flag-red'));
const GREEN = token('--monitor-trace');
const RED_HEX = token('--flag-red');

/** A thread that drops from the origin and then sweeps out to the top of its panel. */
function threadPath(from: Vec3, to: Vec3, via?: Vec3[]): Vec3[] {
  if (via && via.length) return [from, ...via, to];
  const dx = to[0] - from[0];
  return [from, [from[0] + dx * 0.12, from[1] - 0.7, 0], [from[0] + dx * 0.62, to[1] + 0.85, 0], to];
}

/**
 * The shared origin of both consequences: a small luminous node (echoing the lysis event) above the panels, with a thread
 * down to each. The threads grow out in step 4.1, carry occasional bright pulses, and turn red when both panels reach
 * their worst in 4.4.
 */
export function Origin({ getProgress, getPresence, reducedMotion, spec }: Scene4Getters) {
  const { root, materials } = useModelClone('lysisOrigin');
  const group = useRef<Group>(null);
  const light = useAppStore((st) => st.theme === 'light');
  const fade = useFade(materials, group, getPresence);
  const luts = useMemo(
    () => ({
      heart: buildPathLut(threadPath(spec.origin, spec.heartThreadEnd), 96),
      hand: buildPathLut(threadPath(spec.origin, spec.handThreadEnd, spec.handThreadVia), 96),
    }),
    [spec],
  );

  // On the pale canvas the additive glow disappears: draw the node as a solid amber bead instead.
  useEffect(() => {
    materials.forEach((m) => {
      if (light) {
        m.color.set(token('--flag-amber', 'light'));
        m.opacity = 1;
      } else {
        m.color.set('#E8B866');
      }
    });
  }, [light, materials]);

  useFrame(({ clock }) => {
    fade();
    const pulse = reducedMotion ? 0.8 : 0.8 + 0.2 * Math.sin((2 * Math.PI * clock.elapsedTime) / 1.2);
    const crit = criticalLevel(getProgress());
    // Amber at first (the colour of the Scene 1 wave), turning red with the threads in step 4.4.
    materials.forEach((m) => {
      m.emissive.copy(AMBER).lerp(RED, crit).multiplyScalar(light ? 0.15 : 0.5 + 0.4 * pulse);
      m.emissiveIntensity = 1;
    });
    group.current?.scale.setScalar(2.6 * (0.9 + 0.1 * pulse));
  });

  const reach = () => threadReach(getProgress());
  const green = () => (1 - criticalLevel(getProgress())) * Math.max(panelFocus(getProgress()).heart, 0.75);
  const red = () => criticalLevel(getProgress());
  const lines = (which: 'heart' | 'hand') => (
    <>
      <PathLine lut={luts[which]} color={light ? token('--monitor-trace', 'light') : GREEN} getReveal={reach} getEmphasis={green} getPresence={getPresence} showBase={false} dashed={false} blend="normal" />
      <PathLine lut={luts[which]} color={RED_HEX} getReveal={reach} getEmphasis={red} getPresence={getPresence} showBase={false} dashed={false} blend="normal" />
      {!reducedMotion && (
        <FlowStream lut={luts[which]} count={4} traversal={3} color={GREEN} getReveal={reach} getEmphasis={green} getPresence={getPresence} size={0.22} blend="normal" />
      )}
      {!reducedMotion && (
        <FlowStream lut={luts[which]} count={4} traversal={2} color={RED_HEX} getReveal={reach} getEmphasis={red} getPresence={getPresence} size={0.24} blend="normal" />
      )}
    </>
  );

  return (
    <>
      <group ref={group} position={spec.origin}>
        <primitive object={root} />
      </group>
      {lines('heart')}
      {lines('hand')}
    </>
  );
}
