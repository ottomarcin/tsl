import type { Vec3 } from '../../lib/cascade';

export type SystemicLayout = 'side' | 'stacked';

export interface PanelPlacement {
  /** Centre of the panel's subject, in scene space. */
  position: Vec3;
  scale: number;
}

export interface SystemicLayoutSpec {
  origin: Vec3;
  heart: PanelPlacement;
  /** Centre of the ECG strip, and its size in scene units. */
  ecg: { position: Vec3; width: number; height: number };
  hand: PanelPlacement & {
    /** How much larger the hand is drawn at the close-up on Trousseau's sign (1 = no zoom). */
    zoom: number;
    /**
     * Height at which the palm sits at the close-up, when the hand should line up with another panel (side by side: the
     * heart). Without it the fingertips keep the height they had, so the hand grows downwards.
     */
    closeUpY?: number;
  };
  /** Where each thread from the origin ends, just above its panel. */
  heartThreadEnd: Vec3;
  handThreadEnd: Vec3;
  /** Waypoints for the hand's thread when it must route around the other panel (stacked layout). */
  handThreadVia?: Vec3[];
  /** The region that must stay in view, and the offset of its centre from the scene origin. */
  extent: { halfWidth: number; halfHeight: number };
  lookAtDy: number;
}

/** Hand model: elbow at y ≈ -0.07, fingertips at y ≈ 4.0, so its vertical centre is at 1.96. */
export const HAND_CENTER_Y = 1.96;
/** Where the hand turns and zooms about: the middle of the palm (model x, y), so the fingers stay where they are on screen. */
export const HAND_PIVOT = { x: 0.19, y: 3.0 } as const;
/** Fingertips (model y), which the zoom keeps at the same height on screen so the hand never grows into the thread above it. */
export const HAND_TIP_Y = 4.0;

/**
 * At the close-up the palm sits this far above the heart's centre: the forearm hangs below the palm, so the hand and
 * the forearm that is left read as level with the heart only when the palm is a little higher than it.
 */
export const HAND_CLOSEUP_LIFT = 0.9;

/** Heart model: 2.5 tall, centre y ≈ 0.36. */
export const HEART_CENTER_Y = 0.36;

/** Two equal panels side by side on desktop (design spec §5.6), stacked on a portrait screen. */
export const SYSTEMIC_LAYOUTS: Record<SystemicLayout, SystemicLayoutSpec> = {
  side: {
    origin: [0, 4.0, 0],
    heart: { position: [-4.0, 0.9, 0], scale: 1.45 },
    ecg: { position: [-4.0, -2.5, 0], width: 5.6, height: 1.4 },
    // Kept clear of the minimap, which sits at the top right of the screen.
    hand: { position: [3.0, 0.3, 0], scale: 1.05, zoom: 1.9, closeUpY: 0.9 + HAND_CLOSEUP_LIFT },
    heartThreadEnd: [-4.0, 2.7, 0],
    handThreadEnd: [3.0, 2.6, 0],
    extent: { halfWidth: 7.0, halfHeight: 5.0 },
    lookAtDy: 0.3,
  },
  stacked: {
    origin: [0, 8.0, 0],
    heart: { position: [0, 5.2, 0], scale: 1.05 },
    ecg: { position: [0, 2.35, 0], width: 5.4, height: 1.25 },
    hand: { position: [0, -0.55, 0], scale: 0.82, zoom: 1.3 },
    heartThreadEnd: [0, 6.7, 0],
    handThreadEnd: [0.9, 1.15, 0],
    handThreadVia: [
      [2.6, 7.3, 0],
      [3.3, 4.6, 0],
      [3.0, 2.0, 0],
    ],
    extent: { halfWidth: 4.2, halfHeight: 8.6 },
    lookAtDy: 0.55,
  },
};

/** The layout that suits a screen: stacked when it is taller than wide. */
export function layoutForAspect(aspect: number): SystemicLayout {
  return aspect < 1 ? 'stacked' : 'side';
}
