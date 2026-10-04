import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './StepNav.module.css';

export interface StepNavTarget {
  /** Short marker of the step it goes to, e.g. "2.3"; the end card has none. */
  marker?: string;
  label: string;
}

export interface StepNavProps {
  /** Where the buttons go; null where there is nowhere to go (before the first step). */
  previous: StepNavTarget | null;
  next: StepNavTarget | null;
  onPrevious: () => void;
  onNext: () => void;
}

const describe = (target: StepNavTarget) => (target.marker ? `${target.marker} ${target.label}` : target.label);

/** Previous and next step, for moving through the story without scrolling. Each says where it goes. */
export function StepNav({ previous, next, onPrevious, onNext }: StepNavProps) {
  return (
    <div className={styles.group} role="group" aria-label="Move between steps">
      <button
        type="button"
        className={styles.button}
        onClick={onPrevious}
        disabled={!previous}
        aria-label={previous ? `Previous step: ${describe(previous)}` : 'Previous step'}
        title={previous ? `Previous: ${describe(previous)}` : 'This is the first step'}
      >
        <ChevronLeft size={18} aria-hidden="true" />
        <span className={styles.text}>Previous</span>
      </button>
      <button
        type="button"
        className={[styles.button, styles.next].join(' ')}
        onClick={onNext}
        disabled={!next}
        aria-label={next ? `Next step: ${describe(next)}` : 'Next step'}
        title={next ? `Next: ${describe(next)}` : 'This is the last step'}
      >
        <span className={styles.text}>Next</span>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
