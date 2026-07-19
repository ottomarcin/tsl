import type { DiseaseMetric, FlagLevel } from './metric';

/**
 * Generic, direction-aware flag logic — reads thresholds from the metric
 * definition itself. No per-metric hardcoding, so this works unchanged for
 * any disease's metric list, not just TLS's.
 *
 * Boundary rule: `normal` is the inclusive, authoritative band. `redBoundary`
 * is inclusive of red. Everything else is amber.
 */
export function getFlag(metric: DiseaseMetric, value: number): FlagLevel {
  const { direction, normal, redBoundary } = metric.thresholds;
  const isRed = direction === 'higherIsWorse' ? value >= redBoundary : value <= redBoundary;
  if (isRed) return 'red';
  if (value >= normal[0] && value <= normal[1]) return 'normal';
  return 'amber';
}
