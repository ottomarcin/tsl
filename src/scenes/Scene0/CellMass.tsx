import { useMemo } from 'react';
import { collectMeshes } from '../../assets/collectMeshes';
import { useModel } from '../../assets/useModel';
import { tlsModels } from '../../content/tls/models';
import { ModelMass } from '../../graphics/ModelMass';
import type { MassInstance } from '../../lib/massLayout';

export interface CellMassProps {
  instances: MassInstance[];
  reducedMotion: boolean;
}

/**
 * The tumor mass drawn from the real cell model. 200 copies, so it always resolves to a light file (see the
 * manifest's tier rules), never the HD mesh. Suspends while loading: wrap in a ModelBoundary with a placeholder.
 */
export function CellMass({ instances, reducedMotion }: CellMassProps) {
  const gltf = useModel(tlsModels, 'cell', 'instanced');
  const parts = useMemo(() => collectMeshes(gltf.scene), [gltf]);
  return (
    <ModelMass
      parts={parts}
      instances={instances}
      drawOrder={tlsModels.models.cell.drawOrder}
      reducedMotion={reducedMotion}
      pulseAmplitude={0.02}
      pulsePeriod={4.2}
      rotationSpeed={0.12}
    />
  );
}
