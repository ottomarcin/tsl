import { CatmullRomCurve3, Vector3 } from 'three';
import { seededRandom } from './massLayout';
import { CONVERGENCE_POS, KIDNEY_INLET, POOL_CENTER, POOL_RADIUS, type Vec3 } from './cascadePositions';

/**
 * Scene 2 (the cascade) as pure functions of scene progress: where the three tubes run, when each stream lights up,
 * how calcium is drawn out of its pool, and how crystals drift to the kidney. Only the ambient flow of particles along
 * the tubes is driven by the clock; everything that carries the story replays in reverse when scrolling back.
 */
export type { Vec3 } from './cascadePositions';
export type StreamId = 'K' | 'PO4' | 'purines';

export { SOURCE_POS, HEART_POS, POOL_CENTER, POOL_RADIUS, CONVERGENCE_POS, KIDNEY_INLET, KIDNEY_POS } from './cascadePositions';
/** Control points per tube (asset spec §4.2: K short and direct, PO₄ medium, purines long and winding). */
export const TUBE_POINTS: Record<StreamId, Vec3[]> = {
  K: [
    [0, 4.0, 0],
    [-1.0, 3.0, 0.2],
    [-2.5, 1.5, 0],
    [-3.5, -0.2, 0.1],
    // Ends at the heart's upper edge rather than its centre, so the trail doesn't cut across the model.
    [-3.95, -1.0, 0.1],
  ],
  PO4: [
    [0.2, 4.0, 0],
    [0.9, 3.0, 0.1],
    [1.5, 1.8, 0],
    [1.4, 0.3, 0],
    [1.4, -1.0, 0.1],
    [0.9, -2.1, 0],
    CONVERGENCE_POS,
  ],
  purines: [
    [0.4, 4.0, 0],
    [2.6, 4.1, 0],
    [4.4, 3.0, 0.1],
    [5.0, 1.3, 0],
    [3.9, 0.2, 0.1],
    [4.6, -1.1, 0],
    [3.8, -1.95, 0.1],
    [2.2, -2.65, 0],
    [0.9, -2.9, 0],
    CONVERGENCE_POS,
  ],
};

export const STREAM_IDS: StreamId[] = ['K', 'PO4', 'purines'];

/** Per-tube flow (asset spec §4.2): particle count and seconds to traverse. */
export const FLOW: Record<StreamId, { count: number; traversal: number }> = {
  K: { count: 60, traversal: 6 },
  PO4: { count: 80, traversal: 8 },
  purines: { count: 120, traversal: 12 },
};

// ---------------------------------------------------------------- path lookup tables

export interface PathLut {
  /** n points, evenly spaced by arc length, as xyz triples. */
  positions: Float32Array;
  n: number;
  /** Total arc length in world units. */
  length: number;
}

export function buildPathLut(points: Vec3[], n = 256): PathLut {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, 'catmullrom', 0.5);
  const sampled = curve.getSpacedPoints(n - 1);
  const positions = new Float32Array(n * 3);
  sampled.forEach((v, i) => {
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
  });
  return { positions, n, length: curve.getLength() };
}

/** Position at normalised arc-length t (0–1), linearly interpolated between table entries. */
export function lutPoint(lut: PathLut, t: number, out: Vec3 = [0, 0, 0]): Vec3 {
  const f = Math.max(0, Math.min(1, t)) * (lut.n - 1);
  const i = Math.min(lut.n - 2, Math.floor(f));
  const k = f - i;
  const a = i * 3;
  const b = a + 3;
  out[0] = lut.positions[a] + (lut.positions[b] - lut.positions[a]) * k;
  out[1] = lut.positions[a + 1] + (lut.positions[b + 1] - lut.positions[a + 1]) * k;
  out[2] = lut.positions[a + 2] + (lut.positions[b + 2] - lut.positions[a + 2]) * k;
  return out;
}

let cachedLuts: Record<StreamId, PathLut> | null = null;
export function getTubeLuts(): Record<StreamId, PathLut> {
  cachedLuts ??= { K: buildPathLut(TUBE_POINTS.K), PO4: buildPathLut(TUBE_POINTS.PO4), purines: buildPathLut(TUBE_POINTS.purines) };
  return cachedLuts;
}

// ---------------------------------------------------------------- timeline

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Scene progress band in which each stream is the one being explained (steps 2.1–2.3), then all converge (2.4). */
export const STREAM_BAND: Record<StreamId, [number, number]> = { K: [0, 0.25], PO4: [0.25, 0.5], purines: [0.5, 0.75] };
export const CONVERGENCE_START = 0.75;

/** Fraction of the tube's progress band over which its front travels from source to end. */
const REVEAL_SPAN = 0.17;

/** How far along its tube a stream has been revealed (0 = nothing, 1 = the whole tube). */
export function streamReveal(id: StreamId, progress: number): number {
  const [start] = STREAM_BAND[id];
  return smooth(clamp01((progress - start) / REVEAL_SPAN));
}

/** 1 for the stream being explained, dimmed for the others, full for all once they converge. */
export function streamEmphasis(id: StreamId, progress: number): number {
  const [start, end] = STREAM_BAND[id];
  if (progress >= CONVERGENCE_START) return smooth(clamp01((progress - CONVERGENCE_START) / 0.05)) * 0.5 + 0.5;
  if (progress >= start && progress < end) return 1;
  return 0.5;
}

/** 0 until the convergence step, then 1: crystals flow into the kidney, which glows. */
export function convergence(progress: number): number {
  return smooth(clamp01((progress - CONVERGENCE_START) / 0.22));
}

/** When the K⁺ front has reached the heart (0–1 ramp); drives the heart's reaction. */
export function heartArrival(progress: number): number {
  return smooth(clamp01((streamReveal('K', progress) - 0.9) / 0.1));
}

// ---------------------------------------------------------------- calcium pool

export const CALCIUM = { count: 60, consumed: 50, from: 0.27, to: 0.49, travel: 0.035 } as const;
/** Where on the PO₄ tube calcium is drawn in (normalised arc length). */
export const MERGE_T = 0.5;

export interface CalciumParticle {
  /** Rest position in the pool. */
  home: Vec3;
  /** Scene progress at which it leaves the pool; null if it stays (the ~10 that remain). */
  leaveAt: number | null;
  phase: number;
}

export function buildCalcium(seed = 7): CalciumParticle[] {
  const rand = seededRandom(seed);
  const order = Array.from({ length: CALCIUM.count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const leaveRank = new Map<number, number>();
  order.slice(0, CALCIUM.consumed).forEach((particle, rank) => leaveRank.set(particle, rank));
  return Array.from({ length: CALCIUM.count }, (_, i) => {
    // Uniform in the sphere.
    const u = rand();
    const cosT = rand() * 2 - 1;
    const phi = rand() * 2 * Math.PI;
    const r = POOL_RADIUS * Math.cbrt(u);
    const s = Math.sqrt(1 - cosT * cosT);
    const rank = leaveRank.get(i);
    return {
      home: [POOL_CENTER[0] + r * s * Math.cos(phi), POOL_CENTER[1] + r * s * Math.sin(phi), POOL_CENTER[2] + r * cosT],
      leaveAt: rank === undefined ? null : CALCIUM.from + (rank / (CALCIUM.consumed - 1)) * (CALCIUM.to - CALCIUM.from),
      phase: rand() * 2 * Math.PI,
    };
  });
}

export interface CalciumState {
  /** 0 in the pool, 0–1 while travelling to the tube, 1 once fused (gone from the pool). */
  travel: number;
  /** False once the particle has fused with phosphate. */
  visible: boolean;
}

export function calciumState(p: CalciumParticle, progress: number): CalciumState {
  if (p.leaveAt === null || progress < p.leaveAt) return { travel: 0, visible: true };
  const travel = clamp01((progress - p.leaveAt) / CALCIUM.travel);
  return { travel, visible: travel < 1 };
}

/** How many calcium particles are still in the pool or on their way. */
export function calciumRemaining(particles: CalciumParticle[], progress: number): number {
  return particles.filter((c) => calciumState(c, progress).visible).length;
}

// ---------------------------------------------------------------- crystals

export type CrystalKind = 'caphos' | 'uricacid';

export const CRYSTALS: Record<CrystalKind, { count: number; spawn: [number, number]; tube: StreamId; t: number }> = {
  caphos: { count: 18, spawn: [0.29, 0.49], tube: 'PO4', t: MERGE_T },
  // Uric acid forms after the last waypoint on the purine tube (t = 0.85).
  uricacid: { count: 14, spawn: [0.56, 0.74], tube: 'purines', t: 0.88 },
};

/** Fraction of its remaining journey a crystal covers per unit of progress while drifting (before convergence). */
const DRIFT = 1.1;

export interface Crystal {
  kind: CrystalKind;
  spawnAt: number;
  /** Small fixed offset from the tube centre line, so crystals don't stack on one line. */
  offset: Vec3;
  spin: number;
  scale: number;
}

export function buildCrystals(kind: CrystalKind, seed = 11): Crystal[] {
  const { count, spawn } = CRYSTALS[kind];
  const rand = seededRandom(seed + (kind === 'caphos' ? 0 : 100));
  return Array.from({ length: count }, (_, i) => ({
    kind,
    spawnAt: spawn[0] + (i / (count - 1)) * (spawn[1] - spawn[0]),
    offset: [(rand() - 0.5) * 0.45, (rand() - 0.5) * 0.45, (rand() - 0.5) * 0.3],
    spin: rand() * Math.PI * 2,
    scale: 0.85 + rand() * 0.4,
  }));
}

/**
 * Progress along a crystal's journey from where it forms to the kidney: 0 at formation, 1 at the kidney inlet. It
 * drifts slowly with the stream, then the convergence step carries every crystal the rest of the way.
 */
export function crystalJourney(crystal: Crystal, progress: number): number | null {
  if (progress < crystal.spawnAt) return null;
  const drift = Math.min(progress, CONVERGENCE_START) - crystal.spawnAt;
  const u0 = clamp01(drift * DRIFT);
  return u0 + (1 - u0) * convergence(progress);
}

/** The short straight run from the convergence point into the kidney. */
const TAIL_LENGTH = Math.hypot(KIDNEY_INLET[0] - CONVERGENCE_POS[0], KIDNEY_INLET[1] - CONVERGENCE_POS[1]);

/** World position of a crystal at journey progress u (tube from its formation point, then the tail into the kidney). */
export function journeyPoint(lut: PathLut, startT: number, u: number, out: Vec3 = [0, 0, 0]): Vec3 {
  const tubeDist = (1 - startT) * lut.length;
  const d = clamp01(u) * (tubeDist + TAIL_LENGTH);
  if (d <= tubeDist) return lutPoint(lut, startT + d / lut.length, out);
  const k = (d - tubeDist) / TAIL_LENGTH;
  out[0] = CONVERGENCE_POS[0] + (KIDNEY_INLET[0] - CONVERGENCE_POS[0]) * k;
  out[1] = CONVERGENCE_POS[1] + (KIDNEY_INLET[1] - CONVERGENCE_POS[1]) * k;
  out[2] = CONVERGENCE_POS[2] + (KIDNEY_INLET[2] - CONVERGENCE_POS[2]) * k;
  return out;
}

/** Share of all crystals that have arrived at the kidney (0–1): drives its inner glow. */
export function kidneyLoad(progress: number): number {
  return smooth(clamp01((progress - 0.82) / 0.16));
}

/**
 * Equivalent progress used under reduced motion: each step shows a still snapshot, with its stream complete. The last
 * stops short of 1 so the crystals are still visible on their way into the kidney (at 1 they are all absorbed), and
 * short of where the camera starts to dive into the kidney (0.8): a still must not be a frame from a transition.
 */
export const REDUCED_MOTION_PROGRESS = [0.24, 0.49, 0.74, 0.78] as const;

/** Time-driven flow: position of particle j of n on a tube at `time`, as normalised arc length (0–1). */
export function flowT(j: number, n: number, time: number, traversal: number): number {
  const t = j / n + time / traversal;
  return t - Math.floor(t);
}
