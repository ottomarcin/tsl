import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import type { MassInstance } from '../lib/massLayout';

export interface InstancedMassProps {
  instances: MassInstance[];
  /** Fractional scale oscillation, e.g. 0.02 = ±2%. */
  pulseAmplitude?: number;
  /** Seconds per pulse cycle. */
  pulsePeriod?: number;
  /** Radians per second around the vertical axis. */
  rotationSpeed?: number;
  /** Freezes pulse and rotation. */
  reducedMotion?: boolean;
  /** Geometry + material for one unit (a <mesh>'s children). */
  children: ReactNode;
}

const _obj = new Object3D();
const _q = new Quaternion();
const _pos = new Vector3();
const _scale = new Vector3();
const _color = new Color();
const _m = new Matrix4();
void _m;

/** Generic "cluster of units" primitive (tech arch §8.2). Pulse is a per-instance scale placeholder for the shader-driven vertex pulse. */
export function InstancedMass({
  instances,
  pulseAmplitude = 0.02,
  pulsePeriod = 4.2,
  rotationSpeed = 0.1,
  reducedMotion = false,
  children,
}: InstancedMassProps) {
  const group = useRef<Group>(null);
  const mesh = useRef<InstancedMesh>(null);

  const apply = (time: number) => {
    const m = mesh.current;
    if (!m) return;
    instances.forEach((inst, i) => {
      const pulse = 1 + pulseAmplitude * Math.sin((2 * Math.PI * time) / pulsePeriod + inst.phaseOffset);
      _q.set(...inst.rotation);
      _pos.set(...inst.position);
      _scale.set(inst.scale[0] * pulse, inst.scale[1] * pulse, inst.scale[2] * pulse);
      _obj.position.copy(_pos);
      _obj.quaternion.copy(_q);
      _obj.scale.copy(_scale);
      _obj.updateMatrix();
      m.setMatrixAt(i, _obj.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    apply(0);
    instances.forEach((inst, i) => m.setColorAt(i, _color.setRGB(...inst.colorTint)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances]);

  useFrame(({ clock }, delta) => {
    if (reducedMotion) return;
    apply(clock.elapsedTime);
    if (group.current) group.current.rotation.y += delta * rotationSpeed;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, instances.length]} frustumCulled={false}>
        {children}
      </instancedMesh>
    </group>
  );
}
