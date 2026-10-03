/**
 * A small parametric ECG model for the hyperkalaemia sequence (asset spec §6.2): each beat is the sum of a few Gaussian
 * waves (P, Q, R, S, T), and the five named states are parameter sets. Because states are parameters rather than stored
 * samples, morphing between them is an exact interpolation of the numbers, so the trace can change shape mid-beat with
 * no seams. Amplitudes are normalised so the R wave is about 1.
 *
 * The shapes are illustrative of the textbook pattern, not digitised recordings, and were checked against published
 * descriptions (LITFL hyperkalaemia ECG library; ECG Guru "sine wave"; Montague et al. 2008; Mattu et al. 2000):
 *   - peaked T: tall, narrow-based, symmetric ("tented"), the earliest change (about 5.3–6.0 mmol/L in LITFL);
 *   - then the P wave flattens and the PR interval lengthens, with the T wave still peaked;
 *   - then the QRS widens (broad, "bizarre"), the P wave is gone, and the T wave runs into the QRS so that no ST
 *     segment is visible;
 *   - finally the sine wave: QRS, ST and T blend into one smooth, regular undulation with no landmarks, at a *slow*
 *     rate (the ECG Guru example is 61 bpm). It is a pre-terminal rhythm.
 * Hyperkalaemia slows the heart (sinus bradycardia, junctional escape rhythms), so the rate *falls* through the
 * sequence (75 → 78 → 70 → 60 → 60 bpm); an earlier spec draft had it rising. Real patients often do not show these
 * stages in this order, or at all (Montague 2008: peaked T waves had a sensitivity of 0.18): the scene says so.
 * Still an open item for clinical review.
 */
export type EcgState = 'normal_sinus' | 'peaked_t' | 'pr_prolonged_p_flat' | 'qrs_wide' | 'sine_wave';

export const ECG_STATES: EcgState[] = ['normal_sinus', 'peaked_t', 'pr_prolonged_p_flat', 'qrs_wide', 'sine_wave'];

export interface EcgParams {
  rateBpm: number;
  /** P-wave height. */
  pAmp: number;
  /** PR interval in ms: start of the P wave to start of the QRS. */
  prMs: number;
  /** QRS duration in ms. */
  qrsMs: number;
  /** R-wave height. */
  rAmp: number;
  /** T-wave height. */
  tAmp: number;
  /** T-wave width (Gaussian sigma) in ms. */
  tWidthMs: number;
  /** Time from the R peak to the T peak in ms. */
  tGapMs: number;
  /** 0 = ordinary beat, 1 = pure sine wave. */
  sine: number;
}

export const ECG_PARAMS: Record<EcgState, EcgParams> = {
  normal_sinus: { rateBpm: 75, pAmp: 0.15, prMs: 160, qrsMs: 90, rAmp: 1, tAmp: 0.3, tWidthMs: 42, tGapMs: 210, sine: 0 },
  peaked_t: { rateBpm: 78, pAmp: 0.15, prMs: 170, qrsMs: 95, rAmp: 1, tAmp: 0.62, tWidthMs: 26, tGapMs: 190, sine: 0 },
  pr_prolonged_p_flat: { rateBpm: 70, pAmp: 0.05, prMs: 280, qrsMs: 110, rAmp: 0.95, tAmp: 0.6, tWidthMs: 26, tGapMs: 190, sine: 0 },
  qrs_wide: { rateBpm: 60, pAmp: 0, prMs: 280, qrsMs: 160, rAmp: 0.85, tAmp: 0.5, tWidthMs: 52, tGapMs: 112, sine: 0 },
  sine_wave: { rateBpm: 60, pAmp: 0, prMs: 280, qrsMs: 160, rAmp: 0.85, tAmp: 0.5, tWidthMs: 52, tGapMs: 112, sine: 1 },
};

/** Short pattern names for the monitor readout. Patterns, not potassium values (clinical review G5). */
export const ECG_LABELS: Record<EcgState, string> = {
  normal_sinus: 'Normal sinus rhythm',
  peaked_t: 'Peaked T waves',
  pr_prolonged_p_flat: 'Long PR, flat P waves',
  qrs_wide: 'Wide QRS',
  sine_wave: 'Sine wave',
};

const SINE_AMP = 0.6;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function blendParams(a: EcgParams, b: EcgParams, k: number): EcgParams {
  const t = Math.max(0, Math.min(1, k));
  return {
    rateBpm: lerp(a.rateBpm, b.rateBpm, t),
    pAmp: lerp(a.pAmp, b.pAmp, t),
    prMs: lerp(a.prMs, b.prMs, t),
    qrsMs: lerp(a.qrsMs, b.qrsMs, t),
    rAmp: lerp(a.rAmp, b.rAmp, t),
    tAmp: lerp(a.tAmp, b.tAmp, t),
    tWidthMs: lerp(a.tWidthMs, b.tWidthMs, t),
    tGapMs: lerp(a.tGapMs, b.tGapMs, t),
    sine: lerp(a.sine, b.sine, t),
  };
}

const gauss = (x: number, centre: number, sigma: number) => Math.exp(-0.5 * ((x - centre) / sigma) ** 2);

/** Beat length in ms. */
export const beatMs = (p: EcgParams) => 60000 / p.rateBpm;

/** Time of the R peak within a beat, ms (late enough that even a long PR interval fits before it). */
export const rPeakMs = (p: EcgParams) => 0.46 * beatMs(p);

/** The trace at `phase` (0–1 through a beat). */
export function ecgSample(p: EcgParams, phase: number): number {
  const T = beatMs(p);
  const u = (((phase % 1) + 1) % 1) * T;
  const tR = rPeakMs(p);
  const q = p.qrsMs;
  const qrsStart = tR - q / 2;
  const pCentre = qrsStart - p.prMs + 50;
  // A widened QRS is a broader complex, not just a longer baseline: the waves spread out as the QRS lengthens, so a
  // 160 ms complex really looks 160 ms wide (about 4σ of the R wave) instead of a normal spike with space around it.
  const spread = 1 + 0.55 * Math.max(0, Math.min(1, (q - 90) / 70));
  const complex =
    p.pAmp * gauss(u, pCentre, 24) -
    0.12 * p.rAmp * gauss(u, tR - q * 0.4, q * 0.12 * spread) +
    p.rAmp * gauss(u, tR, q * 0.17 * spread) -
    0.22 * p.rAmp * gauss(u, tR + q * 0.4, q * 0.15 * spread) +
    p.tAmp * gauss(u, tR + p.tGapMs, p.tWidthMs);
  if (p.sine <= 0) return complex;
  const sine = SINE_AMP * Math.sin(2 * Math.PI * phase);
  return lerp(complex, sine, Math.min(1, p.sine));
}
