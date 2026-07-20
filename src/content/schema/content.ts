import type { DiseaseMetric } from './metric';
import type { SceneDefinition } from './scene';
import type { CascadeTopology } from './cascade';
import type { InterventionDefinition } from './intervention';
import type { LandingContent } from './landing';

/**
 * The top-level, disease-agnostic content contract. TLS is one instance of
 * this shape — nothing in the component layer or the app store may assume
 * TLS-specific fields exist beyond what's declared here.
 */
export interface DiseaseContent {
  landing: LandingContent;
  metrics: DiseaseMetric[];
  scenes: SceneDefinition[];
  cascade: CascadeTopology;
  interventions: InterventionDefinition[];
}
