import type { ColorLegendItem } from './ColorLegend';
import styles from './ColorLegend.module.css';

/** The legend's rows (a swatch or line and a label each), shared by the on-screen panel and the phone's bottom sheet. */
export function LegendRows({ items }: { items: ColorLegendItem[] }) {
  return (
    <>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          {(item.indicator ?? 'swatch') === 'swatch' ? (
            <span className={styles.swatch} style={{ background: `var(${item.colorToken})` }} />
          ) : (
            <span className={styles.line} style={{ background: `var(${item.colorToken})` }} />
          )}
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </>
  );
}
