export type MetricValueMap = Record<string, number>;
export type InterventionStateMap = Record<string, number | boolean>;

export interface InterventionDefinition {
  id: string;
  label: string;
  /** References CascadeTopology.branches[].id. */
  cascadeBranchId: string;
  /** Normalized position along that branch, 0–1. */
  cascadePositionT: number;
  controlType: 'toggle' | 'slider';
  /**
   * The disease-specific counterfactual math lives here, injected per
   * intervention — never hardcoded inside a generic InterventionPanel component.
   */
  applyEffect: (baseline: MetricValueMap, state: InterventionStateMap) => MetricValueMap;
}
