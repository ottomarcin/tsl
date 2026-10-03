import type { EcgState } from './ecg';

/**
 * Scene 4 (systemic effects in parallel) as pure functions of progress through the scene. Both panels run side by side:
 * the heart's ECG moves through its states during step 4.2, the hand through its poses during step 4.3, and 4.4 puts
 * both at their worst. The lab strip stays put (spec): the panels reference their own severity.
 */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------- cardiac

/** The named ECG state at a point in the scene. Patterns, not potassium values (clinical review G5). */
export function ecgStateAt(progress: number): EcgState {
  if (progress < 0.27) return 'normal_sinus';
  if (progress < 0.35) return 'peaked_t';
  if (progress < 0.43) return 'pr_prolonged_p_flat';
  if (progress < 0.75) return 'qrs_wide';
  return 'sine_wave';
}

/** 0 = regular beat, 1 = chaotic: only at the extreme (sine wave) the heart stutters and pauses. */
export function dysrhythmiaAt(progress: number): number {
  return smooth(clamp01((progress - 0.75) / 0.06));
}

// ---------------------------------------------------------------- neuromuscular

export type PoseName = 'neutral_relaxed' | 'paresthesia_subtle' | 'tetany_mild' | 'trousseau_carpopedal';
export const POSES: PoseName[] = ['neutral_relaxed', 'paresthesia_subtle', 'tetany_mild', 'trousseau_carpopedal'];

/** Scene progress over which the hand moves from the first pose to the last. */
const POSE_FROM = 0.5;
const POSE_TO = 0.74;

/** Blend weight of each pose (they sum to 1): neutral until step 4.3, then through each pose in turn to full spasm. */
export function poseWeights(progress: number): Record<PoseName, number> {
  const pos = clamp01((progress - POSE_FROM) / (POSE_TO - POSE_FROM)) * (POSES.length - 1);
  const lo = Math.min(POSES.length - 2, Math.floor(pos));
  const k = smooth(pos - lo);
  const w = { neutral_relaxed: 0, paresthesia_subtle: 0, tetany_mild: 0, trousseau_carpopedal: 0 };
  w[POSES[lo]] = 1 - k;
  w[POSES[lo + 1]] = k;
  return w;
}

/** The pose that dominates right now. */
export function dominantPose(progress: number): PoseName {
  const w = poseWeights(progress);
  return POSES.reduce((best, p) => (w[p] > w[best] ? p : best), POSES[0]);
}

/** 0 = nerves conduct regularly, 1 = erratic firing (low calcium). */
export function erraticLevel(progress: number): number {
  return smooth(clamp01((progress - 0.58) / 0.16));
}

// ---------------------------------------------------------------- nerve pulses

const hash = (k: number, salt: number) => {
  const x = Math.sin(k * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const PULSE_PERIOD = 1.5;
export const PULSE_TRAVEL = 0.5;
export const MAX_PULSES = 4;

/**
 * Positions (0 elbow … 1 fingertip) of the pulses travelling along the nerves at `time` (seconds). Regular when
 * `erratic` is 0: one every 1.5 s, crossing in 0.5 s. As `erratic` rises the timing jitters, pulses are sometimes
 * skipped and sometimes doubled. Deterministic in `time`, so scrubbing or reloading gives the same picture.
 */
export function nervePulses(time: number, erratic: number): number[] {
  const out: number[] = [];
  const k0 = Math.floor(time / PULSE_PERIOD);
  for (let k = k0 - 2; k <= k0 + 1; k++) {
    const jitter = (hash(k, 1) - 0.5) * erratic * 1.0;
    const skipped = hash(k, 2) < erratic * 0.22;
    const starts: number[] = [];
    if (!skipped) starts.push(k * PULSE_PERIOD + jitter);
    if (hash(k, 3) < erratic * 0.6) starts.push(k * PULSE_PERIOD + jitter + 0.18 + hash(k, 4) * 0.3);
    for (const s of starts) {
      const pos = (time - s) / PULSE_TRAVEL;
      if (pos >= 0 && pos <= 1) out.push(pos);
    }
  }
  return out.slice(0, MAX_PULSES);
}

// ---------------------------------------------------------------- focus and origin

/** How present each panel is: both full in 4.1 and 4.4, the one being discussed forward in 4.2 / 4.3. */
export function panelFocus(progress: number): { heart: number; hand: number } {
  const toHeart = smooth(clamp01((progress - 0.22) / 0.06));
  const fromHeart = smooth(clamp01((progress - 0.47) / 0.06));
  const toBoth = smooth(clamp01((progress - 0.72) / 0.06));
  const heartFocusAmount = toHeart * (1 - fromHeart);
  const handFocusAmount = fromHeart * (1 - toBoth);
  const dim = 0.5;
  return {
    heart: 1 - (1 - dim) * handFocusAmount,
    hand: 1 - (1 - dim) * heartFocusAmount,
  };
}

/** The threads from the origin to the panels: green until both panels are critical, then red (step 4.4). */
export function criticalLevel(progress: number): number {
  return smooth(clamp01((progress - 0.72) / 0.06));
}

/** How far the origin's threads have reached their panels in step 4.1 (they extend, then stay). */
export function threadReach(progress: number): number {
  return smooth(clamp01(progress / 0.16));
}

/** Equivalent progress under reduced motion: still snapshots of each step. */
export const REDUCED_MOTION_PROGRESS = [0.2, 0.4, 0.62, 0.9] as const;
