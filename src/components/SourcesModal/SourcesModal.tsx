import { ExternalLink } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import styles from './SourcesModal.module.css';

export interface SourceEntry {
  id: string;
  text: string;
  href: string;
}

export interface SourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sources: SourceEntry[];
  variant?: 'modal' | 'sheet';
}

/** The numbered reference list, each entry with an outbound link (they open in a new tab). */
export function SourcesModal({ open, onOpenChange, title, sources, variant = 'modal' }: SourcesModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} variant={variant}>
      <ol className={styles.list}>
        {sources.map((source) => (
          <li key={source.id} className={styles.item} value={Number(source.id)}>
            <span className={styles.text}>{source.text}</span>
            <a className={styles.link} href={source.href} target="_blank" rel="noopener noreferrer" aria-label={`Open reference ${source.id} in a new tab`}>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
