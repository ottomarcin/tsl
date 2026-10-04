import * as Tabs from '@radix-ui/react-tabs';
import type { ModeToggle as ModeToggleDefinition } from '../../content/schema';
import styles from './ModeToggle.module.css';

export interface ModeToggleProps {
  toggle: ModeToggleDefinition;
  value: string;
  onChange: (id: string) => void;
}

/**
 * Segmented control for switching what a scene highlights (e.g. the four injury mechanisms). Built on Radix Tabs for
 * arrow-key navigation and ARIA; the option labels, qualifiers and hints come from the scene's content.
 */
export function ModeToggle({ toggle, value, onChange }: ModeToggleProps) {
  const active = toggle.options.find((o) => o.id === value) ?? toggle.options[0];
  return (
    <Tabs.Root className={styles.wrap} value={active.id} onValueChange={onChange} activationMode="manual">
      {/* Said aloud by the tab list's own label; shown so a sighted viewer knows what the choice is about. */}
      <span className={styles.title} aria-hidden="true">
        {toggle.label}
      </span>
      <Tabs.List className={styles.list} aria-label={toggle.label}>
        {toggle.options.map((o) => (
          <Tabs.Trigger key={o.id} value={o.id} className={styles.tab}>
            {o.label}
            {o.badge && <span className={styles.badge}>{o.badge}</span>}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {/* The hint is each tab's panel: it is what the selected option means. */}
      {toggle.options.map((o) => (
        <Tabs.Content key={o.id} value={o.id} className={styles.hint} aria-live="polite">
          {o.hint}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
