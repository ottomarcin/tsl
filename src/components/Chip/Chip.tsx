import { useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { FlagLevel } from '../../content/schema';
import styles from './Chip.module.css';

export interface ChipProps {
  label: string;
  valueText: string;
  state: FlagLevel;
  /** False dims the chip: factor is not present for this case. */
  active?: boolean;
  /** 0–1; renders the bottom fill bar when given. */
  fill?: number;
  /** Tooltip text on hover, focus or tap. */
  reference?: string;
  /** Removes the chip from tab order and pointer events (e.g. while consolidating). */
  inert?: boolean;
}

/** Design spec §6.7. */
export function Chip({ label, valueText, state, active = true, fill, reference, inert = false }: ChipProps) {
  const [open, setOpen] = useState(false);
  const lastPointer = useRef<string>('mouse');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const body = (
    <button
      ref={buttonRef}
      type="button"
      className={[styles.chip, styles[state], active ? styles.active : styles.inactive].join(' ')}
      tabIndex={inert ? -1 : undefined}
      disabled={inert}
    >
      <span className={styles.row}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{valueText}</span>
      </span>
      {fill !== undefined && (
        <span className={styles.bar} aria-hidden="true">
          <span className={styles.barFill} style={{ width: `${Math.round(Math.max(0, Math.min(1, fill)) * 100)}%` }} />
        </span>
      )}
    </button>
  );

  if (!reference) return body;
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root open={open} onOpenChange={(next) => {
        // After a touch, only a tap (below), outside-tap or Escape changes the state: Radix would close it on the same click.
        if (lastPointer.current !== 'touch') setOpen(next);
      }}>
        <Tooltip.Trigger
          asChild
          onPointerDown={(e) => {
            lastPointer.current = e.pointerType;
          }}
          onClick={(e) => {
            // Radix tooltips ignore touch; design spec §6.7 wants tap to show the reference range. The handler sits
            // on Trigger (not the button) so preventDefault stops Radix's own click-to-close.
            if (lastPointer.current === 'touch') {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
        >
          {body}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className={styles.tooltip}
            side="top"
            sideOffset={8}
            onPointerDownOutside={(e) => {
              // A tap on the chip itself is the toggle, not an outside tap.
              if (!buttonRef.current?.contains(e.target as Node)) setOpen(false);
            }}
            onEscapeKeyDown={() => setOpen(false)}
          >
            {reference}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
