import styles from './LiveAnnouncer.module.css';

export interface LiveAnnouncerProps {
  /** What to say; a change of the text is announced. */
  message: string;
}

/** A visually hidden polite live region: the way scene changes and lab changes reach a screen reader. */
export function LiveAnnouncer({ message }: LiveAnnouncerProps) {
  return (
    <div className={styles.region} aria-live="polite" aria-atomic="true" data-testid="live-announcer">
      {message}
    </div>
  );
}
