import { HAND_CENTER_Y, HAND_PIVOT, HAND_TIP_Y, type SystemicLayoutSpec } from './layout';
import { handCloseUp } from '../../lib/systemic';

/**
 * Half-way between the palm facing the viewer and the thumb side facing the viewer (45°): the thumb and the cupped fingers
 * show, and the palm is still partly seen. (The model's thumb is on its +x side, so the turn is negative.)
 */
export const HAND_TURN = -Math.PI / 4;

/** The lowest part of the panel the arm may reach, as model-scale units below the hand's centre; under it is the label. */
const CUT_BELOW_CENTRE = 2.25;
/** How far above the cut the arm fades out, so the cut reads as the arm leaving the frame, not as a hard edge. */
const CUT_FADE = 0.7;

export interface HandView {
  /** Where the pivot (the palm) sits in the scene, and the hand's scale there. */
  pivot: [number, number];
  scale: number;
  /** Rotation about the vertical axis through the pivot (radians). */
  turn: number;
  /** World-space height (before the scene's own offset) under which the arm is cut, and the fade above it. */
  cutY: number;
  cutFade: number;
}

/**
 * The hand's placement at a point in the scene: at rest it is the panel as laid out; at the close-up on Trousseau's sign
 * it has turned to show its thumb side and grown. Side by side it rises to the heart's height, so the two panels read as
 * a pair (`closeUpY`); stacked, the fingertips keep the height they had and it grows downwards, into the part of the arm
 * that is cut off.
 */
export function handView(progress: number, spec: SystemicLayoutSpec): HandView {
  const { turn, zoom } = handCloseUp(progress);
  const [x, y] = spec.hand.position;
  const s = spec.hand.scale;
  const z = 1 + zoom * (spec.hand.zoom - 1);
  const tipY = y + (HAND_TIP_Y - HAND_CENTER_Y) * s;
  const restPivotY = y + (HAND_PIVOT.y - HAND_CENTER_Y) * s;
  // Pinned fingertips: the palm sits one fingers' length below them. Aligned: the palm moves to the other panel's height.
  const pinnedPivotY = tipY - (HAND_TIP_Y - HAND_PIVOT.y) * s * z;
  const pivotY = spec.hand.closeUpY === undefined ? pinnedPivotY : restPivotY + (spec.hand.closeUpY - restPivotY) * zoom;
  return {
    pivot: [x, pivotY],
    scale: s * z,
    // (+ 0: a turn of nothing is 0, not -0)
    turn: turn * HAND_TURN + 0,
    cutY: y - CUT_BELOW_CENTRE * s,
    cutFade: CUT_FADE * s,
  };
}
