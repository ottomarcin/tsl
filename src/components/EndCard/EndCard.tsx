import type { EndCardContent } from '../../content/schema';
import { Button } from '../Button/Button';
import styles from './EndCard.module.css';

export interface EndCardProps {
  content: EndCardContent;
  onReplay: () => void;
  onSources: () => void;
  onRestart: () => void;
}

/** Design spec §5.8: closes the experience over a faint view of Scene 5, with the three ways forward. */
export function EndCard({ content, onReplay, onSources, onRestart }: EndCardProps) {
  return (
    <section className={styles.overlay} aria-labelledby="end-card-title">
      <div className={styles.column}>
        <p className={styles.label}>{content.label}</p>
        <h1 id="end-card-title" className={styles.title}>
          {content.title}
        </h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
        <p className={styles.body}>{content.body}</p>
        <div className={styles.buttons}>
          <Button variant="primary" size="lg" onClick={onReplay}>
            {content.replayLabel}
          </Button>
          <Button variant="secondary" size="lg" onClick={onSources}>
            {content.sourcesLabel}
          </Button>
          <Button variant="secondary" size="lg" onClick={onRestart}>
            {content.restartLabel}
          </Button>
        </div>
        <p className={styles.credits}>
          {content.credits}
          {content.lastReview && <> Last clinical review: {content.lastReview}.</>}
        </p>
        <p className={styles.footer}>{content.footer}</p>
      </div>
    </section>
  );
}
