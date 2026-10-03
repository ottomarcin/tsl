import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { LearnMore } from '../../content/schema';
import styles from './CaptionBlock.module.css';

export interface CaptionBlockProps {
  sceneTitle: string;
  caption: string;
  learnMore?: LearnMore;
}

/** Scene title + step caption + expandable Learn more panel (design spec §6.8). Remount per step to collapse. */
export function CaptionBlock({ sceneTitle, caption, learnMore }: CaptionBlockProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section className={styles.block} aria-label="Scene caption">
      <h2 className={styles.title}>{sceneTitle}</h2>
      <p className={styles.caption} aria-live="polite">
        {caption}
      </p>
      {learnMore && (
        <>
          <button
            type="button"
            className={styles.trigger}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
          >
            Learn more
            {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
          <div id={panelId} className={[styles.panel, open ? styles.panelOpen : ''].join(' ')} hidden={!open}>
            <h3 className={styles.heading}>{learnMore.heading}</h3>
            <p className={styles.body}>{learnMore.body}</p>
            {learnMore.citations.length > 0 && (
              <>
                <p className={styles.sourcesLabel}>Sources for this step</p>
                <ul className={styles.sources}>
                  {learnMore.citations.map((c) => (
                    <li key={c.id}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer noopener" className={styles.link}>
                          {c.text} [{c.id}] <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ) : (
                        <span>
                          {c.text} [{c.id}]
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
