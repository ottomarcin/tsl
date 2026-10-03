import { seededRandom } from './massLayout';
import type { Vec3 } from './cascade';

/**
 * Scene 3 (renal deposition) as pure functions of progress through the scene: crystals entering the nephron tubule and
 * lodging, how obstructed the lumen is, and when each overlay and the feedback loop appear. Everything is in the
 * tubule model's own space: axis along Z, inflow (wide) end at +Z, outflow at -Z.
 */
export const TUBE = {
  length: 4,
  /** Lumen (inner) radius at the inflow and outflow ends: model outer radius minus the 0.08 wall. */
  lumenIn: 0.225,
  lumenOut: 0.175,
} as const;

/** The tubule is drawn this many times larger than the model, so it fills the frame. */
export const TUBE_SCALE = 3;

/** Lumen radius at model z (+2 inflow … -2 outflow). */
export function lumenRadiusAt(z: number): number {
  const s = Math.max(0, Math.min(1, (TUBE.length / 2 - z) / TUBE.length));
  return TUBE.lumenIn + (TUBE.lumenOut - TUBE.lumenIn) * s;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------- crystals

export const CRYSTAL_COUNT = 22;
/** Fraction of crystals that lodge in the wall; the rest pass through (asset spec: ~60%). */
export const LODGE_SHARE = 0.62;
/** Maximum simultaneous lodge points the wall shader supports. */
export const MAX_LODGES = 20;
/** Progress taken to cross the whole tube. */
const TRAVEL = 0.22;
/** Step 3.2 starts here: nothing lodges before it (3.1 is "crystals arrive"). */
const FIRST_LODGE_AT = 0.26;

export type CrystalKind = 'caphos' | 'uricacid';

export interface InflowCrystal {
  kind: CrystalKind;
  /** Progress at which it enters at the inflow end. */
  enterAt: number;
  willLodge: boolean;
  /** Fraction along the tube (0 inflow … 1 outflow) at which it sticks, if it lodges. */
  lodgeS: number;
  angle: number;
  /** Fixed small offset from the axis while it travels, as a fraction of the lumen radius. */
  drift: number;
  scale: number;
  spin: number;
}

export function buildInflow(seed = 31): InflowCrystal[] {
  const rand = seededRandom(seed);
  return Array.from({ length: CRYSTAL_COUNT }, (_, i) => {
    const enterAt = 0.1 + i * 0.036; // about one crystal per 4% of the scene
    const lodgeS = 0.22 + rand() * 0.6;
    const lodgeTime = enterAt + lodgeS * TRAVEL;
    const wants = rand() < LODGE_SHARE;
    return {
      kind: i % 2 === 0 ? 'caphos' : 'uricacid',
      enterAt,
      willLodge: wants && lodgeTime >= FIRST_LODGE_AT,
      lodgeS,
      // Lodgers stick to the half of the wall that is left after the lengthwise cut (local +X faces away from the camera).
      angle: wants && lodgeTime >= FIRST_LODGE_AT ? (rand() - 0.5) * 2.2 : rand() * Math.PI * 2,
      drift: (rand() - 0.5) * 0.7,
      scale: 0.9 + rand() * 0.3,
      spin: rand() * Math.PI * 2,
    };
  });
}

export interface InflowState {
  visible: boolean;
  lodged: boolean;
  /** Position along the tube, 0 inflow … 1 outflow. */
  s: number;
  /** 0 on the axis … 1 pressed against the wall. */
  toWall: number;
}

export function inflowState(c: InflowCrystal, progress: number): InflowState {
  if (progress < c.enterAt) return { visible: false, lodged: false, s: 0, toWall: 0 };
  const travelled = (progress - c.enterAt) / TRAVEL;
  if (!c.willLodge) {
    return { visible: travelled <= 1.04, lodged: false, s: Math.min(travelled, 1.04), toWall: 0 };
  }
  const s = Math.min(travelled, c.lodgeS);
  // It drifts to the wall over the last stretch before its lodge point, then stays.
  const toWall = smooth(clamp01((travelled - (c.lodgeS - 0.1)) / 0.1));
  return { visible: true, lodged: travelled >= c.lodgeS, s, toWall };
}

/** Where a crystal is, in tubule model space. */
export function inflowPoint(c: InflowCrystal, st: InflowState, out: Vec3 = [0, 0, 0]): Vec3 {
  const z = TUBE.length / 2 - st.s * TUBE.length;
  const r = lumenRadiusAt(z) * (c.drift * 0.45 * (1 - st.toWall) + 0.74 * st.toWall);
  const a = c.angle + (c.willLodge ? 0 : c.spin);
  out[0] = Math.cos(a) * Math.abs(r) * Math.sign(r || 1);
  out[1] = Math.sin(a) * Math.abs(r) * Math.sign(r || 1);
  out[2] = z;
  return out;
}

/** The points where crystals are stuck to the wall right now (at most MAX_LODGES, earliest first). */
export function lodgedPoints(crystals: InflowCrystal[], progress: number): Vec3[] {
  const pts: Vec3[] = [];
  for (const c of crystals) {
    if (pts.length >= MAX_LODGES) break;
    const st = inflowState(c, progress);
    if (st.lodged) pts.push(inflowPoint(c, st, [0, 0, 0]));
  }
  return pts;
}

/** 0 = clear, ~1 = badly obstructed. Drives filtrate speed and the lumen narrowing. */
export function obstructionLevel(crystals: InflowCrystal[], progress: number): number {
  const lodgers = crystals.filter((c) => c.willLodge).length || 1;
  const stuck = crystals.filter((c) => inflowState(c, progress).lodged).length;
  return smooth(clamp01(stuck / lodgers)) * 0.95;
}

// ---------------------------------------------------------------- filtrate

export const FILTRATE = { count: 150, speed: 0.3 } as const;

/** Spec: velocity = base × (1 − 0.8 × obstruction). Model units per second. */
export function filtrateSpeed(obstruction: number): number {
  return FILTRATE.speed * (1 - 0.8 * clamp01(obstruction));
}

// ---------------------------------------------------------------- overlays and feedback

/** Step 3.3 starts at progress 0.5: from there the chosen mechanism overlay fades in. */
export function overlayStrength(progress: number): number {
  return smooth(clamp01((progress - 0.5) / 0.06));
}

/** Step 3.4 starts at 0.75: the feedback loop appears. */
export function feedbackStrength(progress: number): number {
  return smooth(clamp01((progress - 0.75) / 0.08));
}

export type Mechanism = 'obstruction' | 'cytotoxicity' | 'vasoconstriction' | 'histone';

/** Which overlay is actually shown: nothing special until step 3.3, then the viewer's choice. */
export function effectiveMechanism(chosen: string | undefined, progress: number): Mechanism {
  if (progress < 0.5) return 'obstruction';
  return (['obstruction', 'cytotoxicity', 'vasoconstriction', 'histone'] as const).find((m) => m === chosen) ?? 'obstruction';
}

/** Equivalent progress under reduced motion: still snapshots of each step. */
export const REDUCED_MOTION_PROGRESS = [0.2, 0.45, 0.7, 0.92] as const;
