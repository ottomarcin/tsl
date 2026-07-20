import { ChevronDown, X } from 'lucide-react';
import styles from './FirstRunScrollHint.module.css';

export interface FirstRunScrollHintProps {
  visible: boolean;
  onDismiss: () => void;
}

/** Design spec §6.4. Presentational only — visibility/timing/dismissal logic lives in useFirstRunHint. */
export function FirstRunScrollHint({ visible, onDismiss }: FirstRunScrollHintProps) {
  if (!visible) return null;

  return (
    <div className={styles.hint} role="status">
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
      <ChevronDown className={styles.arrow} size={24} aria-hidden="true" />
      <span className={styles.label}>Scroll to begin</span>
    </div>
  );
}
