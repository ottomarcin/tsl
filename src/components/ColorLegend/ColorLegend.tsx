import styles from './ColorLegend.module.css';
import { LegendRows } from './LegendRows';

export interface ColorLegendItem {
  colorToken: string;
  label: string;
  /** 'swatch' = filled dot (molecules/crystals). 'line' = a short line (monitor trace, flags). */
  indicator?: 'swatch' | 'line';
}

export interface ColorLegendProps {
  items: ColorLegendItem[];
  expanded: boolean;
  onToggleExpanded: () => void;
}

/** Design spec §6.6. Tap anywhere on the panel toggles collapsed/expanded. */
export function ColorLegend({ items, expanded, onToggleExpanded }: ColorLegendProps) {
  return (
    <button type="button" className={styles.panel} onClick={onToggleExpanded} aria-expanded={expanded}>
      {expanded ? (
        <div className={styles.expanded}>
          <span className={styles.header}>Legend</span>
          <LegendRows items={items} />
        </div>
      ) : (
        <div className={styles.collapsed}>
          <div className={styles.dots}>
            {items.slice(0, 5).map((item) => (
              <span key={item.label} className={styles.miniDot} style={{ background: `var(${item.colorToken})` }} />
            ))}
          </div>
          <span className={styles.label}>Legend</span>
        </div>
      )}
    </button>
  );
}
