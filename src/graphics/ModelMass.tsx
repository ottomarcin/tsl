import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Group } from 'three';
import type { ModelPart } from '../assets/collectMeshes';
import type { MassInstance } from '../lib/massLayout';
import { InstancedModelRig } from './InstancedModelRig';
import { massMatrix, pulseScale } from './massTransform';

export interface ModelMassProps {
  parts: ModelPart[];
  instances: MassInstance[];
  drawOrder?: string[];
  pulseAmplitude?: number;
  pulsePeriod?: number;
  rotationSpeed?: number;
  reducedMotion?: boolean;
}

const tint = new Color();

/** A cluster of loaded-model instances that breathes and slowly turns: the real-model counterpart of `InstancedMass`. */
export function ModelMass({
  parts,
  instances,
  drawOrder,
  pulseAmplitude = 0.02,
  pulsePeriod = 4.2,
  rotationSpeed = 0.1,
  reducedMotion = false,
}: ModelMassProps) {
  const group = useRef<Group>(null);
  const rig = useMemo(() => new InstancedModelRig(parts, instances.length, { drawOrder }), [parts, instances.length, drawOrder]);
  useEffect(() => () => rig.dispose(), [rig]);

  const write = (time: number) => {
    instances.forEach((inst, i) => rig.setMatrixAt(i, massMatrix(inst, pulseScale(time, pulsePeriod, pulseAmplitude, inst.phaseOffset))));
    rig.commit();
  };

  useLayoutEffect(() => {
    instances.forEach((inst, i) => rig.setColorAt(i, tint.setRGB(...inst.colorTint)));
    write(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig, instances]);

  useFrame(({ clock }, delta) => {
    if (reducedMotion) return;
    write(clock.elapsedTime);
    if (group.current) group.current.rotation.y += delta * rotationSpeed;
  });

  return (
    <group ref={group}>
      <primitive object={rig.group} />
    </group>
  );
}
