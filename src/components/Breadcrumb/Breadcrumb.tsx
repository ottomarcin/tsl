import { ChevronRight } from 'lucide-react';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  /** Short marker such as "2" or "2.3". */
  marker: string;
  label: string;
  /** Present when it can be clicked (a parent); the last item is where the viewer is. */
  onSelect?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/** Where the viewer is in the story: scene, then step. Everything but the last item takes you back up. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;
  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const content = (
            <>
              <span className={styles.marker}>{item.marker}</span>
              <span className={styles.label}>{item.label}</span>
            </>
          );
          return (
            <li key={`${item.marker}-${i}`} className={styles.item}>
              {last || !item.onSelect ? (
                <span className={styles.current} aria-current={last ? 'location' : undefined}>
                  {content}
                </span>
              ) : (
                <button type="button" className={styles.link} onClick={item.onSelect}>
                  {content}
                </button>
              )}
              {!last && <ChevronRight size={14} className={styles.separator} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
