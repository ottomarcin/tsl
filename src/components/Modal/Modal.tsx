import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export type ModalVariant = 'modal' | 'sheet';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** 'modal' = centered dialog (desktop). 'sheet' = slides up from the bottom (mobile). */
  variant?: ModalVariant;
  showCloseButton?: boolean;
}

/**
 * Generic Dialog wrapper (tech arch §8.5) — Radix handles focus trapping,
 * escape-to-close, and return-focus-on-close; our tokens style it directly
 * via Radix's data-state attributes. Shared by every modal and mobile bottom
 * sheet in the app (Sources, Replay Scene, SideNav's mobile sheet, etc.) —
 * pulled forward from Epic 9 since Epic 2's mobile chrome variants need it.
 */
export function Modal({ open, onOpenChange, title, children, variant = 'modal', showCloseButton = true }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={variant === 'sheet' ? styles.sheet : styles.modal}>
          {variant === 'sheet' && <div className={styles.dragHandle} aria-hidden="true" />}
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            {showCloseButton && (
              <Dialog.Close asChild>
                <button type="button" className={styles.closeButton} aria-label="Close">
                  <X size={18} />
                </button>
              </Dialog.Close>
            )}
          </div>
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
