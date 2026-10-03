import type { DiseaseContent } from '../schema';
import { tlsLanding } from './landing';
import { tlsMetrics } from './metrics';
import { tlsCascade } from './cascade';
import { tlsInterventions } from './interventions';
import { tlsScenes } from './scenes';
import { tlsModels } from './models';

export const tlsContent: DiseaseContent = {
  landing: tlsLanding,
  metrics: tlsMetrics,
  scenes: tlsScenes,
  cascade: tlsCascade,
  interventions: tlsInterventions,
  models: tlsModels,
};

export { tlsLanding } from './landing';
export { tlsMetrics } from './metrics';
export { tlsCascade } from './cascade';
export { tlsInterventions, computeCounterfactual } from './interventions';
export { tlsScenes } from './scenes';
export { tlsModels } from './models';
export { cite, allTlsCitations } from './citations';
