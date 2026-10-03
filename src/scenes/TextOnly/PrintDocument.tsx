import type { EndCardContent } from '../../content/schema';
import { tlsContent } from '../../content/tls';
import { TextOnlyScene } from './TextOnlyScene';
import styles from './PrintDocument.module.css';

/**
 * What is printed (design spec §10): the six scenes as text, one per page, with the labs and the sources of each step;
 * no navigation, lab strip or 3D. The spec's static diagrams do not exist yet, so the text carries the content. Shown
 * only while printing, in light colours whatever the theme.
 */
export function PrintDocument({ endCard = tlsContent.endCard }: { endCard?: EndCardContent }) {
  return (
    <div className={styles.document} data-testid="print-document">
      {tlsContent.scenes.map((scene) => (
        <section key={scene.id} className={styles.page}>
          <p className={styles.running}>{endCard.title}</p>
          <TextOnlyScene sceneIndex={scene.index} interactive={false} />
          <p className={styles.footer}>{endCard.footer}</p>
        </section>
      ))}
    </div>
  );
}
