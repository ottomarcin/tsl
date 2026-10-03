import { Map } from 'lucide-react';
import styles from './MinimapToggle.module.css';

export interface MinimapToggleProps {
  onClick: () => void;
}

/** Below the desktop width the cascade minimap does not fit on screen; this opens it on its own (design spec §4.4). */
export function MinimapToggle({ onClick }: MinimapToggleProps) {
  return (
    <button type="button" className={styles.toggle} onClick={onClick} aria-haspopup="dialog" aria-label="Show cascade map" title="Show cascade map">
      <Map size={18} aria-hidden="true" />
    </button>
  );
}
