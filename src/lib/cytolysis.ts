import type { MassInstance } from './massLayout';
import { seededRandom } from './massLayout';

/**
 * Scroll-driven cytolysis model for Scene 1 (design spec §5.3, asset spec §3.2). Everything is a pure function of
 * scene progress (0–1), so scrolling back replays the event in reverse.
 */
/** z of the camera-facing plane the bar is drawn on. */
export const WAVE_PLANE_Z = 0.5;

export const WAVE = {
  xMin: -6.5,
  xMax: 6.5,
  /** Progress at which the wave enters / leaves the mass. */
  pStart: 0.18,
  pEnd: 0.66,
} as const;

/**
 * Progress spans for one cell, relative to the moment the bar's leading edge reaches it ("arrival"). A cell strains as
 * the bar approaches (`lead`), its membrane gives way as the edge touches it (`burstDelay` after arrival; 0 = at the
 * edge), the tear completes within `ruptureSnap`, then it shrinks away (`fade`). The bar sweeps ~27 world units per
 * unit of progress, so every 0.01 of delay puts the visible damage ~0.27 units farther behind the bar: the damage must
 * read as done BY the bar, not trailing it. (An earlier 0.10 delay left a ~500 px gap between bar and damage.)
 */
export const CELL_TIMING = { lead: 0.06, burstDelay: 0, ruptureSnap: 0.02, fade: 0.2 } as const;

export const PARTICLES = {
  perCellPerSystem: 30,
  speed: 0.8,
  jitter: 0.3,
  gravity: 0.05,
  drag: 0.05,
  /** Particle lifetime in progress units, and the "seconds" the physics integrates over that span. */
  lifeProgress: 0.9,
  lifeSeconds: 6,
  upwardBias: 0.15,
} as const;

/**
 * Where along the sweep axis the bar must be, drawn on its flat plane, to look like it touches this cell from the
 * camera. Perspective pushes cells nearer the camera away from the centre line and pulls farther ones in, so the raw
 * x would make the bar reach front cells late and back cells early (a visible gap between bar and damage).
 */
export function waveCoordinate(position: readonly [number, number, number], cameraDistance: number): number {
  const cellDepth = Math.max(cameraDistance - position[2], 0.1);
  return (position[0] * (cameraDistance - WAVE_PLANE_Z)) / cellDepth;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function waveX(progress: number): number {
  const t = clamp01((progress - WAVE.pStart) / (WAVE.pEnd - WAVE.pStart));
  return WAVE.xMin + t * (WAVE.xMax - WAVE.xMin);
}

/** Wavefront strength: fades in as it enters and out after it leaves. */
export function waveOpacity(progress: number): number {
  const fadeIn = clamp01((progress - (WAVE.pStart - 0.03)) / 0.03);
  const fadeOut = clamp01(1 - (progress - WAVE.pEnd) / 0.04);
  return Math.min(fadeIn, fadeOut);
}

/** Progress at which the wave reaches x. */
export function arrivalProgress(x: number): number {
  const t = clamp01((x - WAVE.xMin) / (WAVE.xMax - WAVE.xMin));
  return WAVE.pStart + t * (WAVE.pEnd - WAVE.pStart);
}

/** Progress at which the cell at x ruptures (and emits its particles). */
export function ruptureProgress(x: number): number {
  return arrivalProgress(x) + CELL_TIMING.burstDelay;
}

export interface CellState {
  /** 0 intact → 1 fully deformed. */
  deform: number;
  /** 0 → 1 once the membrane has given way. */
  rupture: number;
  /** 1 visible → 0 gone. */
  alive: number;
}

export function cellState(progress: number, x: number): CellState {
  const arrive = arrivalProgress(x);
  const burst = ruptureProgress(x);
  return {
    deform: smooth(clamp01((progress - (arrive - CELL_TIMING.lead)) / (CELL_TIMING.lead + CELL_TIMING.burstDelay))),
    rupture: smooth(clamp01((progress - burst) / CELL_TIMING.ruptureSnap)),
    alive: 1 - smooth(clamp01((progress - burst) / CELL_TIMING.fade)),
  };
}

export type ParticleSystemId = 'K' | 'PO4' | 'purines';
export const PARTICLE_SYSTEM_SEEDS: Record<ParticleSystemId, number> = { K: 101, PO4: 202, purines: 303 };

/** Initial velocity per particle (flat xyz triples): radial with a slight upward bias plus per-axis jitter. */
export function buildParticleVelocities(cellCount: number, seed: number): Float32Array {
  const rand = seededRandom(seed);
  const n = cellCount * PARTICLES.perCellPerSystem;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const z = rand() * 2 - 1;
    const phi = rand() * 2 * Math.PI;
    const r = Math.sqrt(1 - z * z);
    let dx = r * Math.cos(phi);
    let dy = r * Math.sin(phi) + PARTICLES.upwardBias;
    let dz = z;
    const len = Math.hypot(dx, dy, dz);
    dx /= len;
    dy /= len;
    dz /= len;
    out[i * 3] = dx * PARTICLES.speed + (rand() * 2 - 1) * PARTICLES.jitter;
    out[i * 3 + 1] = dy * PARTICLES.speed + (rand() * 2 - 1) * PARTICLES.jitter;
    out[i * 3 + 2] = dz * PARTICLES.speed + (rand() * 2 - 1) * PARTICLES.jitter;
  }
  return out;
}

/** Brightness over life: constant for the first 70%, then fading to zero. */
export function particleBrightness(life: number): number {
  if (life < 0 || life > 1) return 0;
  return life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;
}

/**
 * Fills `positions` and `colors` (rgb, pre-multiplied by brightness for additive blending) for every particle at
 * `progress`. Particles that are not born or already dead sit at their cell with zero brightness.
 */
export function fillParticleBuffers(
  positions: Float32Array,
  colors: Float32Array,
  cells: MassInstance[],
  /** Each cell's `waveCoordinate`, which decides when it bursts. */
  waveCoords: ArrayLike<number>,
  velocities: Float32Array,
  rgb: [number, number, number],
  progress: number,
  /** 3: rgb pre-multiplied by brightness (additive blending). 4: full rgb + brightness as alpha (normal blending). */
  colorStride: 3 | 4 = 3,
): void {
  const per = PARTICLES.perCellPerSystem;
  const dragK = PARTICLES.drag;
  for (let c = 0; c < cells.length; c++) {
    const [ox, oy, oz] = cells[c].position;
    const life = (progress - ruptureProgress(waveCoords[c])) / PARTICLES.lifeProgress;
    const b = particleBrightness(life);
    const t = Math.max(0, life) * PARTICLES.lifeSeconds;
    const travel = (1 - Math.exp(-dragK * t)) / dragK;
    const fall = 0.5 * PARTICLES.gravity * t * t;
    for (let k = 0; k < per; k++) {
      const i = (c * per + k) * 3;
      positions[i] = ox + velocities[i] * travel;
      positions[i + 1] = oy + velocities[i + 1] * travel - fall;
      positions[i + 2] = oz + velocities[i + 2] * travel;
      if (colorStride === 4) {
        const j = (c * per + k) * 4;
        colors[j] = rgb[0];
        colors[j + 1] = rgb[1];
        colors[j + 2] = rgb[2];
        colors[j + 3] = b;
      } else {
        colors[i] = rgb[0] * b;
        colors[i + 1] = rgb[1] * b;
        colors[i + 2] = rgb[2] * b;
      }
    }
  }
}

/** Equivalent progress used under reduced motion: each step shows a still snapshot of the event. */
export const REDUCED_MOTION_PROGRESS = [0.3, 0.78, 1] as const;

/** Camera keyframes (asset spec `s1_camera_path`): hold through the wave, then pull back to roughly double distance. */
export const CYTOLYSIS_CAMERA_PATH = [
  { progress: 0, distance: 0.85, y: 0, fov: 50 },
  { progress: 0.6, distance: 0.85, y: 0, fov: 50 },
  { progress: 1, distance: 1.75, y: 0.5, fov: 55 },
];
