import type { CascadeBranch } from '../../content/schema';
import styles from './CascadeMinimap.module.css';

export interface CascadeMinimapProps {
  branches: CascadeBranch[];
  /**
   * The branch id currently in focus; 'kidney' for the convergence point where the streams end (Scene 3); 'full' to
   * highlight everything (Scene 5); or null to hide the minimap entirely.
   */
  highlightedId: string | string[] | 'kidney' | 'full' | null;
  /** Heading shown above the map, saying what it is. */
  title?: string;
  /** "You are here" line under the map, saying where the current scene sits on it. */
  locationLabel?: string;
  /** Text for the kidney's label on the map. */
  kidneyLabel?: string;
}

const WIDTH = 180;
const HEIGHT = 196;
const TOP = 28;
/** Where the straight part of a lane ends and a converging lane starts to bend toward the meeting point. */
const BEND = 112;
const TERMINUS = 136;
const MEET = { x: WIDTH / 2, y: 150 };

/** A lane either ends at a terminal point of its own (its last waypoint is at t = 1) or runs down to the meeting point. */
function laneGeometry(branch: CascadeBranch, i: number, count: number) {
  const x = 30 + i * ((WIDTH - 60) / Math.max(1, count - 1));
  const ownTerminus = branch.waypoints.some((w) => w.t >= 1);
  const d = ownTerminus
    ? `M ${x} ${TOP} L ${x} ${TERMINUS}`
    : `M ${x} ${TOP} L ${x} ${BEND} C ${x} ${BEND + 26}, ${MEET.x} ${MEET.y - 28}, ${MEET.x} ${MEET.y}`;
  const straightEnd = ownTerminus ? TERMINUS : BEND;
  return { x, d, ownTerminus, straightEnd };
}

/**
 * A small map of the cascade (design spec §6.5): the lanes from the Scene 2 diagram, converging on the kidney, with
 * particles drifting along them and the current section lit. Generated from the cascade topology. The real
 * `shared_cascade_minimap.svg` asset (asset spec §8) hasn't been produced yet; this stands in for it. The drifting
 * particles are hidden under reduced motion.
 */
export function CascadeMinimap({ branches, highlightedId, title = 'The cascade', locationLabel, kidneyLabel = 'Kidney' }: CascadeMinimapProps) {
  if (highlightedId === null) return null;
  const ids = Array.isArray(highlightedId) ? highlightedId : [highlightedId];
  const kidneyLit = highlightedId === 'kidney' || highlightedId === 'full';

  return (
    <div className={styles.panel} role="img" aria-label={locationLabel ? `Cascade progress minimap. ${locationLabel}` : 'Cascade progress minimap'}>
      <p className={styles.title}>{title}</p>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        {branches.map((branch, i) => {
          const isHighlighted = highlightedId === 'full' || ids.includes(branch.id);
          const dimmed = highlightedId === 'kidney';
          const { x, d, ownTerminus, straightEnd } = laneGeometry(branch, i, branches.length);
          const color = `var(${branch.colorToken})`;
          return (
            <g
              key={branch.id}
              data-branch={branch.id}
              opacity={isHighlighted ? 1 : dimmed ? 0.55 : 0.4}
              className={isHighlighted ? styles.highlighted : undefined}
            >
              <text x={x} y={13} textAnchor="middle" className={styles.laneLabel} fill={color}>
                {branch.label}
              </text>
              <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
              {ownTerminus && <circle cx={x} cy={TERMINUS} r={4.5} fill={color} />}
              {branch.waypoints
                .filter((w) => w.t < 1)
                .map((wp, wi) => (
                  <circle key={wi} data-waypoint cx={x} cy={TOP + wp.t * (straightEnd - TOP)} r={3} fill={color} />
                ))}
              {[0, 1, 2].map((k) => (
                <circle key={`flow-${k}`} className={styles.flow} r={2} fill={color}>
                  <animateMotion dur={`${2.6 + i * 0.7}s`} begin={`${-k * (2.6 + i * 0.7) / 3}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))}
            </g>
          );
        })}

        {/* The kidney, where the streams converge. */}
        <g data-testid="minimap-kidney" data-lit={kidneyLit} opacity={kidneyLit ? 1 : 0.45}>
          {kidneyLit && <ellipse className={styles.pulse} cx={MEET.x} cy={176} rx={36} ry={19} fill="none" stroke="var(--crystal)" strokeWidth={1.5} />}
          <path
            d="M 64 174 C 62 162, 96 158, 112 165 C 122 170, 120 179, 110 180 C 102 181, 100 187, 106 191 C 96 196, 66 192, 64 174 Z"
            fill={kidneyLit ? 'var(--crystal)' : 'none'}
            fillOpacity={kidneyLit ? 0.55 : 0}
            stroke="var(--crystal)"
            strokeWidth={1.5}
          />
          <text x={MEET.x + 44} y={178} className={styles.laneLabel} fill="var(--text-secondary)">
            {kidneyLabel}
          </text>
        </g>
      </svg>
      {locationLabel && (
        <p className={styles.here}>
          <span className={styles.hereDot} aria-hidden="true" />
          {locationLabel}
        </p>
      )}
    </div>
  );
}
