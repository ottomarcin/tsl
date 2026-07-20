import * as Tooltip from '@radix-ui/react-tooltip';
import styles from './StageProgress.module.css';

export interface StageProgressProps {
  /** 0-based index of the current stage. */
  current: number;
  total: number;
  /** Optional per-stage label shown in a tooltip on hover/focus. */
  labels?: string[];
  onJump: (index: number) => void;
}

/** Design spec §6.11. */
export function StageProgress({ current, total, labels, onJump }: StageProgressProps) {
  return (
    <Tooltip.Provider delayDuration={400}>
      <div className={styles.track} role="group" aria-label="Scene progress">
        {Array.from({ length: total }, (_, index) => {
          const state = index < current ? 'completed' : index === current ? 'current' : 'future';
          const label = labels?.[index] ?? `Scene ${index}`;
          const dot = (
            <button
              type="button"
              className={[styles.dot, styles[state]].join(' ')}
              aria-label={label}
              aria-current={state === 'current' ? 'step' : undefined}
              onClick={() => onJump(index)}
            />
          );
          return (
            <Tooltip.Root key={index}>
              <Tooltip.Trigger asChild>{dot}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} side="top" sideOffset={8}>
                  {label}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
}
