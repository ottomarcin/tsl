import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, type Group } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import type { CascadeWaypoint } from '../../content/schema';
import { getTubeLuts, lutPoint, streamReveal, type Vec3 } from '../../lib/cascade';
import { useModelClone } from './useModelClone';
import type { ProgressProps } from './Organs';
import { token } from '../../lib/tokens';

export interface WaypointsProps extends ProgressProps {
  getPresence: () => number;
  waypoints: CascadeWaypoint[];
  /** Labels that name an enzyme (drawn as a ring, not a disc). */
  enzymeLabel: string;
  moleculeColor: string;
  /** True when the markers should be on show whatever the stream has reached (Scene 5's idle cascade). */
  getAlwaysShown?: () => boolean;
}

const PURINE = new Color(token('--mol-purines'));
const ENZYME = new Color(token('--monitor-trace'));

function Marker({
  waypoint,
  position,
  enzyme,
  getProgress,
  getPresence,
  reducedMotion,
  moleculeColor,
  getAlwaysShown,
}: {
  waypoint: CascadeWaypoint;
  position: Vec3;
  enzyme: boolean;
  getProgress: () => number;
  getPresence: () => number;
  reducedMotion: boolean;
  moleculeColor: string;
  getAlwaysShown?: () => boolean;
}) {
  const { root, materials } = useModelClone(enzyme ? 'xoEnzyme' : 'waypoint');
  const group = useRef<Group>(null);
  const label = useRef(0);

  useFrame(({ clock }, delta) => {
    // Appears as the purine stream's front reaches it.
    const reached = getAlwaysShown?.() ? 1 : Math.max(0, Math.min(1, (streamReveal('purines', getProgress()) - waypoint.t) / 0.08 + 0.001));
    const shown = reached * getPresence();
    label.current += (shown - label.current) * Math.min(1, delta * 8);
    if (!group.current) return;
    group.current.visible = shown > 0.01;
    group.current.scale.setScalar((enzyme ? 1.25 : 1.35) * (0.4 + 0.6 * shown));
    // Catalytic ring turns about its vertical axis; a gentle glow pulse stands in for particles passing through.
    const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3 + waypoint.t * 10);
    if (enzyme && !reducedMotion) group.current.rotation.y = clock.elapsedTime * Math.PI;
    materials.forEach((m) => {
      m.emissive.copy(enzyme ? ENZYME : PURINE);
      m.emissiveIntensity = (enzyme ? 0.25 : 0.1) + (enzyme ? 0.45 : 0.6) * pulse * shown;
    });
  });

  return (
    <>
      <group ref={group} position={position}>
        <primitive object={root} />
      </group>
      <ScenePointLabel
        position={[position[0], position[1] + (enzyme ? -0.55 : 0.5), position[2]]}
        text={waypoint.label}
        color={enzyme ? 'var(--monitor-trace)' : moleculeColor}
        subtle={enzyme}
        getOpacity={() => label.current}
      />
    </>
  );
}

/** Hypoxanthine / xanthine / uric acid nodes and the two xanthine-oxidase rings along the purine tube. */
export function Waypoints({ waypoints, enzymeLabel, moleculeColor, getProgress, getPresence, reducedMotion, getAlwaysShown }: WaypointsProps) {
  const lut = getTubeLuts().purines;
  const positions = useMemo(() => waypoints.map((w) => lutPoint(lut, w.t, [0, 0, 0] as Vec3)), [waypoints, lut]);
  return (
    <>
      {waypoints.map((w, i) => (
        <Marker
          key={`${w.label}-${w.t}`}
          waypoint={w}
          position={positions[i]}
          enzyme={w.label === enzymeLabel}
          getProgress={getProgress}
          getPresence={getPresence}
          reducedMotion={reducedMotion}
          moleculeColor={moleculeColor}
          getAlwaysShown={getAlwaysShown}
        />
      ))}
    </>
  );
}
