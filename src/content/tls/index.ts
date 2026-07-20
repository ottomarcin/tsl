import type { DiseaseContent } from '../schema';
import { tlsLanding } from './landing';
import { tlsMetrics } from './metrics';
import { tlsCascade } from './cascade';
import { tlsInterventions } from './interventions';
import { tlsScenes } from './scenes';

export const tlsContent: DiseaseContent = {
  landing: tlsLanding,
  metrics: tlsMetrics,
  scenes: tlsScenes,
  cascade: tlsCascade,
  interventions: tlsInterventions,
};

export { tlsLanding } from './landing';
export { tlsMetrics } from './metrics';
export { tlsCascade } from './cascade';
export { tlsInterventions, computeCounterfactual } from './interventions';
export { tlsScenes } from './scenes';
export { cite, allTlsCitations } from './citations';
