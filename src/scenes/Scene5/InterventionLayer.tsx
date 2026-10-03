import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, DoubleSide, type Group, type MeshBasicMaterial } from 'three';
import { ScenePointLabel } from '../../components/ScenePointLabel/ScenePointLabel';
import { FlowStream } from '../../graphics/FlowStream';
import { PathLine } from '../../graphics/PathLine';
import { KIDNEY_POS, CONVERGENCE_POS, buildPathLut, getTubeLuts, lutPoint, type Vec3 } from '../../lib/cascade';
import { badgesShown, isOn, scene5Step, type InterventionEffects } from '../../lib/scene5';
import { useAppStore } from '../../store/useAppStore';
import { activeInterventions } from '../shared/scene5State';
import { tlsInterventions } from '../../content/tls/interventions';

export interface InterventionLayerProps {
  getG: () => number;
  getPresence: () => number;
  getEffects: () => InterventionEffects;
  reducedMotion: boolean;
}

interface BadgeSpec {
  id: 'rasburicase' | 'allopurinol' | 'hydration' | 'dialysis';
  label: string;
  sub?: string;
  pictogram: string;
  position: Vec3;
  /** Which way the caption sits from the badge, so it clears the lines around it. */
  caption: [number, number];
  align: 'start' | 'end' | 'center';
}

const purineLut = getTubeLuts().purines;
const positionOnPurines = (id: string): Vec3 => {
  const def = tlsInterventions.find((d) => d.id === id)!;
  return lutPoint(purineLut, def.cascadePositionT, [0, 0, 0] as Vec3);
};

/** The dialysis circuit loops beside the kidney (clear of its label), in the part of it that is in view; its badge sits in the middle. */
const CIRCUIT_CENTER: Vec3 = [KIDNEY_POS[0] + 4.3, KIDNEY_POS[1] + 0.9, 0];

/** Where each badge sits (asset spec §7.2): on the purine tube at the enzyme step and at the uric-acid end, where the tubes meet, and at the kidney. */
const BADGES: BadgeSpec[] = [
  { id: 'rasburicase', label: 'Rasburicase', pictogram: 'UA → A', position: positionOnPurines('rasburicase'), caption: [0.2, -0.85], align: 'end' },
  { id: 'allopurinol', label: 'Allopurinol / Febuxostat', pictogram: 'XO ✕', position: positionOnPurines('allopurinol'), caption: [0.55, 0], align: 'start' },
  { id: 'hydration', label: 'IV hydration', sub: '2–3 L/m²/day', pictogram: '▼', position: [CONVERGENCE_POS[0] - 1.3, CONVERGENCE_POS[1] - 0.35, CONVERGENCE_POS[2]], caption: [-0.55, 0], align: 'end' },
  { id: 'dialysis', label: 'Dialysis (RRT)', pictogram: '⟳', position: CIRCUIT_CENTER, caption: [0, 1.25], align: 'center' },
];

const RADIUS = 0.42;

function Badge({ spec, getG, getPresence, light, compact }: { spec: BadgeSpec; getG: () => number; getPresence: () => number; light: boolean; compact: boolean }) {
  const group = useRef<Group>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const shown = useRef(0);
  const active = useRef(0);
  const ink = light ? '#2A2722' : '#F4F1EA';
  const fill = light ? '#FFFFFF' : '#0B0E12';

  useFrame((_, delta) => {
    const g = getG();
    const onStage = g >= 4.9 && badgesShown(scene5Step(g))[spec.id];
    const target = (onStage ? 1 : 0) * getPresence();
    const on = onStage && isOn(spec.id, activeInterventions(g));
    shown.current += (target - shown.current) * Math.min(1, delta * 6);
    active.current += ((on ? 1 : 0) - active.current) * Math.min(1, delta * 6);
    if (group.current) {
      group.current.visible = shown.current > 0.01;
      group.current.scale.setScalar(0.35 + 0.65 * shown.current);
    }
    if (ring.current) {
      ring.current.opacity = shown.current * (0.45 + 0.55 * active.current);
    }
  });

  const [cx, cy] = spec.caption;
  return (
    <>
      <group ref={group} name="intervention-badge" position={spec.position}>
        <mesh>
          <circleGeometry args={[RADIUS, 40]} />
          <meshBasicMaterial color={fill} transparent opacity={0.88} side={DoubleSide} depthWrite={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[RADIUS - 0.045, RADIUS, 48]} />
          <meshBasicMaterial ref={ring} color={ink} transparent opacity={0} side={DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      <ScenePointLabel position={spec.position} text={spec.pictogram} color={ink} getOpacity={() => shown.current * (0.6 + 0.4 * active.current)} />
      <ScenePointLabel
        position={[spec.position[0] + cx, spec.position[1] + cy, spec.position[2]]}
        text={spec.sub ? `${spec.label} · ${spec.sub}` : spec.label}
        color={ink}
        // On a narrow screen only the badge in play is named; the others would overlap.
        getOpacity={() => (compact ? shown.current * active.current : shown.current * (0.55 + 0.45 * active.current))}
        align={spec.align}
      />
    </>
  );
}

/** The dialysis circuit: blood leaves beside the kidney, passes through the machine and returns. */
const CIRCUIT: Vec3[] = [
  [-1.1, -0.35],
  [-0.1, 0.9],
  [0.9, 0.45],
  [0.9, -0.5],
  [0.0, -0.95],
  [-0.9, -0.85],
].map(([x, y]) => [CIRCUIT_CENTER[0] + x, CIRCUIT_CENTER[1] + y, 0] as Vec3);

/**
 * Scene 5's additions to the cascade: the intervention badges at their intercept points, and the dialysis circuit that
 * runs beside the kidney when dialysis is on. The streams, crystals and kidney respond to the interventions in their own
 * components; this layer only adds what is new in the scene.
 */
export function InterventionLayer({ getG, getPresence, getEffects, reducedMotion }: InterventionLayerProps) {
  const light = useAppStore((s) => s.theme === 'light');
  const compact = useThree((s) => s.size.width < 768);
  const circuit = useMemo(() => buildPathLut([...CIRCUIT, CIRCUIT[0]], 96), []);
  const color = useMemo(() => new Color(light ? '#2F8859' : '#5FBF8F').getStyle(), [light]);
  const getCircuitPresence = () => getEffects().dialysis * getPresence();
  return (
    <>
      {BADGES.map((spec) => (
        <Badge key={spec.id} spec={spec} getG={getG} getPresence={getPresence} light={light} compact={compact} />
      ))}
      <PathLine lut={circuit} color={color} getReveal={() => 1} getEmphasis={() => 0.8} showBase={false} dashed={reducedMotion} blend={light ? 'normal' : 'additive'} getPresence={getCircuitPresence} />
      {!reducedMotion && (
        <FlowStream lut={circuit} count={26} traversal={5} color={color} getReveal={() => 1} getEmphasis={() => 1} blend={light ? 'normal' : 'additive'} getPresence={getCircuitPresence} />
      )}
    </>
  );
}
