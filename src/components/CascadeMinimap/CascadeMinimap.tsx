import type { CascadeBranch } from '../../content/schema';
import styles from './CascadeMinimap.module.css';

export interface CascadeMinimapProps {
  branches: CascadeBranch[];
  /** The branch id currently in focus, 'full' to highlight everything (Scene 5), or null to hide the minimap entirely. */
  highlightedId: string | 'full' | null;
}

const WIDTH = 180;
const HEIGHT = 220;

/**
 * Placeholder visual (tech arch §11) — the real `shared_cascade_minimap.svg`
 * asset (asset spec §8) hasn't been produced yet. Renders a simple line +
 * waypoint-dot diagram generated directly from the cascade topology data,
 * swapped for the real asset once Epic 13 produces it.
 */
export function CascadeMinimap({ branches, highlightedId }: CascadeMinimapProps) {
  if (highlightedId === null) return null;

  return (
    <div className={styles.panel} role="img" aria-label="Cascade progress minimap">
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {branches.map((branch, i) => {
          const isHighlighted = highlightedId === 'full' || highlightedId === branch.id;
          const x = 20 + i * ((WIDTH - 40) / Math.max(1, branches.length - 1));
          const yTop = 12;
          const yBottom = HEIGHT - 12;
          const color = `var(${branch.colorToken})`;
          return (
            <g key={branch.id} opacity={isHighlighted ? 1 : 0.4} className={isHighlighted ? styles.highlighted : undefined}>
              <line x1={x} y1={yTop} x2={x} y2={yBottom} stroke={color} strokeWidth={2} />
              {branch.waypoints.map((wp, wi) => (
                <circle key={wi} cx={x} cy={yTop + wp.t * (yBottom - yTop)} r={3} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
