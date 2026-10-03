import { Accessibility } from 'lucide-react';
import styles from './AccessibilityToggle.module.css';

export interface AccessibilityToggleProps {
  /** True when the text-only version is showing. */
  textOnly: boolean;
  onToggle: () => void;
}

/** Switches between the 3D experience and the text-only version of the same content. Pressed = text only. */
export function AccessibilityToggle({ textOnly, onToggle }: AccessibilityToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-pressed={textOnly}
      aria-label="Text-only mode"
      title={textOnly ? 'Back to the 3D experience' : 'Text-only mode: all the content, without the 3D scene'}
    >
      <Accessibility size={18} aria-hidden="true" />
    </button>
  );
}
