import type { FlagLevel } from '../../content/schema';
import styles from './HighRiskBadge.module.css';

export interface HighRiskBadgeProps {
  label: string;
  state?: FlagLevel;
  visible: boolean;
  /** Stops the pulsing ring (reduced motion). */
  reducedMotion?: boolean;
}

/** Consolidated badge for Scene 0 (asset spec §2.2 `s0_high_risk_badge`); label and state are supplied, not hardcoded. */
export function HighRiskBadge({ label, state = 'red', visible, reducedMotion = false }: HighRiskBadgeProps) {
  return (
    <div
      className={[styles.badge, styles[state], visible ? styles.visible : '', reducedMotion ? styles.still : ''].join(' ')}
      role="status"
      aria-hidden={!visible}
      data-visible={visible}
    >
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
