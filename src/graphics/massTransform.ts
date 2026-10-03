import { Object3D } from 'three';
import type { MassInstance } from '../lib/massLayout';

const scratch = new Object3D();

/** Writes an instance's transform (position, rotation, scale × pulse) into `scratch` and returns its matrix. */
export function massMatrix(inst: MassInstance, scaleMultiplier = 1) {
  scratch.position.set(...inst.position);
  scratch.quaternion.set(...inst.rotation);
  scratch.scale.set(inst.scale[0] * scaleMultiplier, inst.scale[1] * scaleMultiplier, inst.scale[2] * scaleMultiplier);
  scratch.updateMatrix();
  return scratch.matrix;
}

/** 1 ± amplitude, desynchronised per instance by its phase offset. */
export function pulseScale(time: number, period: number, amplitude: number, phase: number): number {
  return 1 + amplitude * Math.sin((2 * Math.PI * time) / period + phase);
}
