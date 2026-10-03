import styles from './AssetLoadingBar.module.css';

export interface AssetLoadingBarProps {
  /** True while anything is loading. */
  active: boolean;
  /** 0–100. */
  progress: number;
}

/** Thin progress bar along the top of the viewport while a scene's models load (design spec §6.15). */
export function AssetLoadingBar({ active, progress }: AssetLoadingBarProps) {
  if (!active) return null;
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className={styles.track} role="progressbar" aria-label="Loading 3D models" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  );
}
