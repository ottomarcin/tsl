import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Toast.module.css';

export interface ToastProps {
  message: string;
  action?: { label: string; onClick: () => void };
  /** Closes itself after this many ms; stays until dismissed when absent. */
  autoDismissMs?: number;
  onDismiss: () => void;
}

/** A message at the bottom right with an optional action (design spec §10: load timeout, unexpected errors). */
export function Toast({ message, action, autoDismissMs, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <div className={styles.toast} role="alert">
      <p className={styles.message}>{message}</p>
      {action && (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
