import { Sparkles, Zap } from 'lucide-react';
import type { ModelQuality } from '../../content/schema';
import styles from './QualityToggle.module.css';

export interface QualityToggleProps {
  quality: ModelQuality;
  onToggle: () => void;
}

/** Switches between high-quality and standard (lighter) 3D models. Pressed = high quality. */
export function QualityToggle({ quality, onToggle }: QualityToggleProps) {
  const high = quality === 'high';
  const label = high ? 'High-quality 3D models. Switch to standard quality' : 'Standard-quality 3D models. Switch to high quality';
  return (
    <button type="button" className={styles.toggle} onClick={onToggle} aria-label={label} aria-pressed={high} title={high ? 'High quality' : 'Standard quality'}>
      {high ? <Sparkles size={18} aria-hidden="true" /> : <Zap size={18} aria-hidden="true" />}
    </button>
  );
}
