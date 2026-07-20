import { Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

/** Design spec §6.3. Dark mode shows a sun icon (tap to go light) and vice versa. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={!isDark}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
