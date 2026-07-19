export type FlagLevel = 'normal' | 'amber' | 'red';

/** Which direction of change is clinically worse for this metric. */
export type ThresholdDirection = 'higherIsWorse' | 'lowerIsWorse';

export interface MetricThresholds {
  direction: ThresholdDirection;
  /** Inclusive band — authoritative for the 'normal' flag. */
  normal: [number, number];
  /** Reference-range tick display only; 'amber' is everything outside `normal` and not yet `red`. */
  amber: [number, number];
  /** Inclusive boundary into 'red', in the direction given by `direction`. */
  redBoundary: number;
}

export interface DiseaseMetric {
  /** Generic key (e.g. 'K') — consumers never assume this is TLS-specific. */
  id: string;
  label: string;
  unit: string;
  decimalPlaces: number;
  thresholds: MetricThresholds;
}
