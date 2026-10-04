import { AlertTriangle } from 'lucide-react';
import type { LandingContent } from '../../content/schema';
import { Button } from '../Button/Button';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import styles from './LandingScreen.module.css';

export interface LandingScreenProps {
  content: LandingContent;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  webglSupported: boolean;
  onBegin: () => void;
  loading?: boolean;
  showSlowLoadMessage?: boolean;
}

/** Design spec §5.1. */
export function LandingScreen({
  content,
  theme,
  onToggleTheme,
  webglSupported,
  onBegin,
  loading = false,
  showSlowLoadMessage = false,
}: LandingScreenProps) {
  return (
    <main className={styles.page}>
      <div className={styles.themeToggleSlot}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className={styles.column}>
        <p className={styles.label}>{content.label}</p>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
        <p className={styles.body}>{content.body}</p>

        {webglSupported ? (
          <div className={styles.ctaBlock}>
            <Button size="lg" onClick={onBegin} loading={loading} className={styles.cta}>
              {loading ? 'Loading…' : content.ctaLabel}
            </Button>
            {loading && showSlowLoadMessage && <p className={styles.slowLoad}>{content.slowLoadMessage}</p>}
          </div>
        ) : (
          <div className={styles.unsupported} data-testid="webgl-unsupported" role="alert">
            <AlertTriangle size={32} />
            <p>{content.webglUnsupportedMessage}</p>
          </div>
        )}

        <p className={styles.meta}>{content.meta}</p>
      </div>
    </main>
  );
}
