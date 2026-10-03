export interface MassInstance {
  position: [number, number, number];
  /** Unit quaternion [x, y, z, w]. */
  rotation: [number, number, number, number];
  scale: [number, number, number];
  /** Radians, 0–2π — desynchronises the pulse across instances. */
  phaseOffset: number;
  /** Per-channel multiplier around 1. */
  colorTint: [number, number, number];
}

export interface MassLayoutOptions {
  count: number;
  /** Gaussian sigma of the position distribution. */
  sigma: number;
  /** Minimum centre-to-centre distance. */
  minSpacing: number;
  seed: number;
}

/** mulberry32 — small deterministic PRNG so the layout is identical on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** Shoemake's method: uniformly distributed random unit quaternion. */
function randomQuaternion(rand: () => number): [number, number, number, number] {
  const u1 = rand();
  const u2 = rand() * 2 * Math.PI;
  const u3 = rand() * 2 * Math.PI;
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  return [a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3)];
}

/** Asset spec §2.2 `s0_tumor_mass` algorithm: gaussian cluster, rejection on spacing, jittered scale/tint. */
export function generateMassLayout({ count, sigma, minSpacing, seed }: MassLayoutOptions): MassInstance[] {
  const rand = seededRandom(seed);
  const minSq = minSpacing * minSpacing;
  const out: MassInstance[] = [];
  const maxAttempts = count * 500;
  let attempts = 0;

  while (out.length < count && attempts++ < maxAttempts) {
    const p: [number, number, number] = [gaussian(rand) * sigma, gaussian(rand) * sigma, gaussian(rand) * sigma];
    const clear = out.every((o) => {
      const dx = o.position[0] - p[0];
      const dy = o.position[1] - p[1];
      const dz = o.position[2] - p[2];
      return dx * dx + dy * dy + dz * dz >= minSq;
    });
    if (!clear) continue;
    out.push({
      position: p,
      rotation: randomQuaternion(rand),
      scale: [0.9 + rand() * 0.2, 0.9 + rand() * 0.2, 0.9 + rand() * 0.2],
      phaseOffset: rand() * 2 * Math.PI,
      colorTint: [0.95 + rand() * 0.1, 0.95 + rand() * 0.1, 0.95 + rand() * 0.1],
    });
  }
  return out;
}
