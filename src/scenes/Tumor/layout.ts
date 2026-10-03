import type { MassInstance } from '../../lib/massLayout';

/** The layout rotated about the vertical axis by `angle` (same convention as three's `rotation.y`). */
export function rotateLayout(instances: MassInstance[], angle: number): MassInstance[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return instances.map((inst) => ({
    ...inst,
    position: [inst.position[0] * c + inst.position[2] * s, inst.position[1], -inst.position[0] * s + inst.position[2] * c],
  }));
}
