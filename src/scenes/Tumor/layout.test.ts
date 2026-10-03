import { describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { generateMassLayout } from '../../lib/massLayout';
import { rotateLayout } from './layout';

describe('rotateLayout', () => {
  const cells = generateMassLayout({ count: 12, sigma: 1.5, minSpacing: 0.7, seed: 4 });

  it('matches three.js rotation.y exactly (the group that holds the real cells uses it)', () => {
    const angle = 1.15;
    const rotated = rotateLayout(cells, angle);
    const o = new Object3D();
    o.rotation.y = angle;
    o.updateMatrix();
    cells.forEach((c, i) => {
      const v = o.localToWorld(new Object3D().position.set(...c.position));
      expect(rotated[i].position[0]).toBeCloseTo(v.x, 6);
      expect(rotated[i].position[1]).toBeCloseTo(v.y, 6);
      expect(rotated[i].position[2]).toBeCloseTo(v.z, 6);
    });
  });
  it('preserves distances from the axis and leaves height alone', () => {
    const rotated = rotateLayout(cells, 0.7);
    cells.forEach((c, i) => {
      expect(Math.hypot(rotated[i].position[0], rotated[i].position[2])).toBeCloseTo(Math.hypot(c.position[0], c.position[2]), 9);
      expect(rotated[i].position[1]).toBe(c.position[1]);
    });
  });
  it('is the identity at angle 0', () => {
    expect(rotateLayout(cells, 0).map((c) => c.position)).toEqual(cells.map((c) => c.position));
  });
});
