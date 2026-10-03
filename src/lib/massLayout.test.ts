import { describe, expect, it } from 'vitest';
import { generateMassLayout, seededRandom } from './massLayout';

const OPTS = { count: 200, sigma: 1.5, minSpacing: 0.7, seed: 7 };

describe('seededRandom', () => {
  it('is deterministic and within [0,1)', () => {
    const a = seededRandom(1);
    const b = seededRandom(1);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateMassLayout', () => {
  const layout = generateMassLayout(OPTS);

  it('places the requested number of instances', () => {
    expect(layout).toHaveLength(200);
  });

  it('is identical across calls with the same seed and differs for another seed', () => {
    expect(generateMassLayout(OPTS)).toEqual(layout);
    expect(generateMassLayout({ ...OPTS, seed: 8 })[0].position).not.toEqual(layout[0].position);
  });

  it('keeps every pair at least minSpacing apart', () => {
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const [a, b] = [layout[i].position, layout[j].position];
        expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeGreaterThanOrEqual(0.7 - 1e-9);
      }
    }
  });

  it('is denser at the core than at the surface', () => {
    const radii = layout.map((l) => Math.hypot(...l.position));
    const inner = radii.filter((r) => r < 1.5).length;
    const outer = radii.filter((r) => r > 3).length;
    expect(inner).toBeGreaterThan(0);
    expect(outer).toBeLessThan(layout.length / 2);
  });

  it('emits unit quaternions and jitter inside the spec ranges', () => {
    for (const l of layout) {
      expect(Math.hypot(...l.rotation)).toBeCloseTo(1, 6);
      l.scale.forEach((s) => { expect(s).toBeGreaterThanOrEqual(0.9); expect(s).toBeLessThanOrEqual(1.1); });
      l.colorTint.forEach((c) => { expect(c).toBeGreaterThanOrEqual(0.95); expect(c).toBeLessThanOrEqual(1.05); });
      expect(l.phaseOffset).toBeLessThanOrEqual(2 * Math.PI);
    }
  });

  it('stops rather than looping forever when the spacing cannot be satisfied', () => {
    const tight = generateMassLayout({ count: 50, sigma: 0.01, minSpacing: 5, seed: 1 });
    expect(tight.length).toBeLessThan(50);
  });
});
