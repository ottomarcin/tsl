import type { DiseaseMetric } from '../../content/schema';
import { LabCell } from './LabCell';
import { StageProgress } from '../StageProgress/StageProgress';
import styles from './LabStrip.module.css';

export interface LabStripProps {
  metrics: DiseaseMetric[];
  values: Record<string, number>;
  timestamp?: string;
  currentStage: number;
  totalStages: number;
  stageLabels?: string[];
  onJumpToStage: (index: number) => void;
  reducedMotion?: boolean;
}

/**
 * Design spec §6.1. Fully generic (tech arch §8.2) — has no idea what K⁺ or
 * Ca²⁺ are, it just renders whatever metric list it's given.
 */
export function LabStrip({
  metrics,
  values,
  timestamp,
  currentStage,
  totalStages,
  stageLabels,
  onJumpToStage,
  reducedMotion = false,
}: LabStripProps) {
  return (
    <div className={styles.strip}>
      <div className={styles.cells}>
        {metrics.map((metric) => (
          <LabCell key={metric.id} metric={metric} value={values[metric.id] ?? 0} reducedMotion={reducedMotion} />
        ))}
      </div>
      <div className={styles.trailing}>
        {timestamp && <span className={styles.timestamp}>{timestamp}</span>}
        <StageProgress current={currentStage} total={totalStages} labels={stageLabels} onJump={onJumpToStage} />
      </div>
    </div>
  );
}
