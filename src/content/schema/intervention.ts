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
  /** For a slider: the state runs 0–1; this is what 1 means to the viewer (e.g. 4 L/m²/day). */
  slider?: { max: number; unit: string };
  /**
   * The disease-specific counterfactual math lives here, injected per
   * intervention — never hardcoded inside a generic InterventionPanel component.
   */
  applyEffect: (baseline: MetricValueMap, state: InterventionStateMap) => MetricValueMap;
}
