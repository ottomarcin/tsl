import * as Slider from '@radix-ui/react-slider';
import styles from './TimelineScrubber.module.css';

export interface TimelineScrubberProps {
  /** 0 (start) to 1 (end). */
  value: number;
  onChange: (value: number) => void;
  /** Shown at each end and as the current time, e.g. 'T+0h'. */
  startLabel: string;
  endLabel: string;
  currentLabel: string;
  ariaLabel: string;
}

/** A draggable time marker under the scene (asset spec `s5_timeline_scrubber`): replay the cascade, forward or back. */
export function TimelineScrubber({ value, onChange, startLabel, endLabel, currentLabel, ariaLabel }: TimelineScrubberProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.end}>{startLabel}</span>
      <Slider.Root className={styles.slider} min={0} max={1} step={0.01} value={[value]} onValueChange={([v]) => onChange(v)}>
        <Slider.Track className={styles.track}>
          <Slider.Range className={styles.range} />
        </Slider.Track>
        <Slider.Thumb className={styles.thumb} aria-label={ariaLabel} aria-valuetext={currentLabel}>
          <span className={styles.now} aria-hidden="true">
            {currentLabel}
          </span>
        </Slider.Thumb>
      </Slider.Root>
      <span className={styles.end}>{endLabel}</span>
    </div>
  );
}
