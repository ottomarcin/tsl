import type { DiseaseContent } from '../schema';
import { tlsMetrics } from './metrics';
import { tlsCascade } from './cascade';
import { tlsInterventions } from './interventions';
import { tlsScenes } from './scenes';

export const tlsContent: DiseaseContent = {
  metrics: tlsMetrics,
  scenes: tlsScenes,
  cascade: tlsCascade,
  interventions: tlsInterventions,
};

export { tlsMetrics } from './metrics';
export { tlsCascade } from './cascade';
export { tlsInterventions, computeCounterfactual } from './interventions';
export { tlsScenes } from './scenes';
export { cite, allTlsCitations } from './citations';
