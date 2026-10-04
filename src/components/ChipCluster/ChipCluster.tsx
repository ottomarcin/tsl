import type { CSSProperties } from 'react';
import type { ChipDefinition } from '../../content/schema';
import { Chip } from '../Chip/Chip';
import styles from './ChipCluster.module.css';

export type ChipClusterPhase = 'hidden' | 'shown' | 'merged';

export interface ChipClusterProps {
  chips: ChipDefinition[];
  /** hidden: not yet revealed · shown: staggered in around the centre · merged: pulled into the centre and faded. */
  phase: ChipClusterPhase;
  reducedMotion?: boolean;
  /** ring: ellipse around the centre (wide screens) · column: single stacked list (narrow screens). */
  layout?: 'ring' | 'column';
  /** Mass is shifted right to make room for a left caption column (short landscape screens). */
  shifted?: boolean;
}

const STAGGER_MS = 150;
const CENTRE = { x: 50, y: 52 };
/** Narrower ring when the layer is only the part of the screen right of the caption column (short landscape). */
const SHIFTED_RADIUS_X = 26;

/**
 * The part of the layer the caption block and the legend cover (lower left), as percentages of the layer: no chip may
 * sit in it, or it is hidden behind them.
 */
export const CAPTION_ZONE = { maxX: 40, minY: 62 } as const;

/**
 * Evenly spaced positions along an arc of an ellipse around the centre: from the left, over the top, to the bottom
 * centre. The lower-left part of the ring is left out because that is where the caption sits.
 */
export function chipAnchor(index: number, count: number, radiusX = 36): { x: number; y: number } {
  const from = (-165 * Math.PI) / 180;
  const to = (85 * Math.PI) / 180;
  const angle = count > 1 ? from + (index / (count - 1)) * (to - from) : -Math.PI / 2;
  return { x: CENTRE.x + Math.cos(angle) * radiusX, y: CENTRE.y + Math.sin(angle) * 32 };
}

/** Single centred column in the upper part of the layer, clear of the caption block below. */
export function chipColumnAnchor(index: number, count: number): { x: number; y: number } {
  // Starts below the top-right toggles (44px) even on a 320px-wide phone.
  const top = 13;
  const bottom = 58;
  return { x: 50, y: count > 1 ? top + (index / (count - 1)) * (bottom - top) : top };
}

/**
 * Overlay layer for a scene's chips: staggers them in, then merges them toward the centre.
 * Plain DOM over the canvas (not drei <Html>) — the scroll proxy sits above the canvas and would swallow
 * chip pointer events.
 */
export function ChipCluster({ chips, phase, reducedMotion = false, layout = 'ring', shifted = false }: ChipClusterProps) {
  return (
    <div className={[styles.layer, shifted ? styles.layerShifted : ''].join(' ')} data-phase={phase} data-layout={layout} data-shifted={shifted}>
      {chips.map((chip, i) => {
        const anchor = phase === 'merged' ? CENTRE : layout === 'column' ? chipColumnAnchor(i, chips.length) : chipAnchor(i, chips.length, shifted ? SHIFTED_RADIUS_X : undefined);
        const delay = reducedMotion ? 0 : phase === 'shown' ? i * STAGGER_MS : 0;
        const style: CSSProperties = {
          left: `${anchor.x}%`,
          top: `${anchor.y}%`,
          transitionDelay: `${delay}ms`,
          transitionDuration: reducedMotion ? '0ms' : undefined,
        };
        return (
          <div
            key={chip.id}
            className={[styles.slot, phase === 'shown' ? styles.shown : ''].join(' ')}
            style={style}
            aria-hidden={phase !== 'shown'}
            data-testid={`chip-slot-${chip.id}`}
          >
            <Chip
              label={chip.label}
              valueText={chip.valueText}
              state={chip.state}
              active={chip.active}
              fill={chip.fill}
              reference={chip.reference}
              inert={phase !== 'shown'}
            />
          </div>
        );
      })}
    </div>
  );
}
