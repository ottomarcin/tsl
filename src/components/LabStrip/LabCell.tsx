import { AlertTriangle } from 'lucide-react';
import type { DiseaseMetric } from '../../content/schema';
import { getFlag } from '../../content/schema';
import { useTweenedValue } from './useTweenedValue';
import styles from './LabStrip.module.css';

export interface LabCellProps {
  metric: DiseaseMetric;
  value: number;
  reducedMotion?: boolean;
}

/**
 * Reference-range tick positions are a presentational approximation, not
 * spec-defined: the design spec calls for "faint tick marks at the normal-
 * range bounds" but doesn't define the overall display scale a metric sits
 * within. Approximated here as 30% below the lower of {normal, redBoundary}
 * to 30% above the higher, which is stable regardless of threshold direction.
 */
function tickPositions(metric: DiseaseMetric): [number, number] {
  const { normal, redBoundary } = metric.thresholds;
  const lo = Math.min(normal[0], redBoundary);
  const hi = Math.max(normal[1], redBoundary);
  const span = hi - lo || 1;
  const displayMin = lo - span * 0.3;
  const displayMax = hi + span * 0.3;
  const pct = (v: number) => ((v - displayMin) / (displayMax - displayMin)) * 100;
  return [pct(normal[0]), pct(normal[1])];
}

export function LabCell({ metric, value, reducedMotion = false }: LabCellProps) {
  const displayValue = useTweenedValue(value, 800, reducedMotion);
  const flag = getFlag(metric, value);
  const [tickLow, tickHigh] = tickPositions(metric);

  return (
    <div className={[styles.cell, styles[`flag-${flag}`]].join(' ')}>
      <div className={styles.ticks} aria-hidden="true">
        <span className={styles.tick} style={{ left: `${tickLow}%` }} />
        <span className={styles.tick} style={{ left: `${tickHigh}%` }} />
      </div>
      <span className={styles.label}>{metric.label}</span>
      <span className={styles.value}>
        {flag === 'red' && <AlertTriangle size={12} className={styles.alertIcon} />}
        {displayValue.toFixed(metric.decimalPlaces)}
      </span>
      <span className={styles.unit}>{metric.unit}</span>
    </div>
  );
}
