import { Component, type ReactNode } from 'react';
import styles from './CanvasBoundary.module.css';

export interface CanvasBoundaryProps {
  children: ReactNode;
  /** Switches to the text-only version, which needs no 3D at all. */
  onTextOnly: () => void;
}

interface State {
  failed: boolean;
}

/**
 * Catches a crash anywhere in the 3D scene so the page around it (menu, labs, captions) keeps working, and offers the
 * two ways forward: reload, or read the same content as text.
 */
export class CanvasBoundary extends Component<CanvasBoundaryProps, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className={styles.fallback} role="alert">
        <p className={styles.message}>The 3D scene stopped working.</p>
        <div className={styles.buttons}>
          <button type="button" className={styles.button} onClick={() => window.location.reload()}>
            Reload
          </button>
          <button type="button" className={styles.button} onClick={this.props.onTextOnly}>
            Read it as text
          </button>
        </div>
      </div>
    );
  }
}
