import { Modal } from '../Modal/Modal';
import styles from './ReplaySceneModal.module.css';

export interface ReplayScene {
  index: number;
  title: string;
  /** One line on what the scene shows. */
  summary: string;
}

export interface ReplaySceneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  scenes: ReplayScene[];
  onPick: (index: number) => void;
  variant?: 'modal' | 'sheet';
}

/** A card per scene; choosing one closes the dialog and jumps there. */
export function ReplaySceneModal({ open, onOpenChange, title, scenes, onPick, variant = 'modal' }: ReplaySceneModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} variant={variant}>
      <ul className={styles.grid}>
        {scenes.map((scene) => (
          <li key={scene.index}>
            <button
              type="button"
              className={styles.card}
              onClick={() => {
                onOpenChange(false);
                onPick(scene.index);
              }}
            >
              <span className={styles.number} aria-hidden="true">
                {scene.index}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{scene.title}</span>
                <span className={styles.summary}>{scene.summary}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
