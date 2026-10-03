import { ECG_PARAMS, blendParams, beatMs, ecgSample, type EcgParams, type EcgState } from './ecg';

/** Spec §6.10: the trace scrolls right to left at 25 mm/s, about 80 px/s on screen, and morphs over 1.0 s. */
export const TRACE_PX_PER_SECOND = 80;
export const MORPH_SECONDS = 1.0;

export interface EcgTraceOptions {
  width: number;
  height: number;
  pxPerSecond?: number;
  /** A pulse on the monitor: ~1 beat of "irregularity" is added to the rhythm when above 0 (ventricular dysrhythmia). */
  initialState?: EcgState;
}

/**
 * The scrolling ECG as plain data, independent of where it is drawn (a DOM canvas, a texture on a 3D plane, a test).
 * New columns are computed at the right edge from the *current* waveform, so when the state changes the trace changes
 * shape as it scrolls, like a real monitor, rather than the whole strip changing at once.
 */
export class EcgTrace {
  readonly width: number;
  readonly height: number;
  private readonly pxPerSecond: number;
  /** One amplitude per pixel column, oldest first. */
  readonly columns: Float32Array;
  private from: EcgParams;
  private to: EcgParams;
  private morph = 1;
  private phase = 0;
  private carry = 0;
  private target: EcgState;

  constructor({ width, height, pxPerSecond = TRACE_PX_PER_SECOND, initialState = 'normal_sinus' }: EcgTraceOptions) {
    this.width = Math.max(1, Math.round(width));
    this.height = height;
    this.pxPerSecond = pxPerSecond;
    this.columns = new Float32Array(this.width);
    this.from = this.to = ECG_PARAMS[initialState];
    this.target = initialState;
    this.fillStatic(initialState);
  }

  /** Where in the beat the newest column is (0–1; the QRS is at ~0.46). The heart contracts in step with it. */
  get beatPhase(): number {
    return ((this.phase % 1) + 1) % 1;
  }

  get state(): EcgState {
    return this.target;
  }

  /** The waveform currently being produced (mid-morph while changing). */
  get params(): EcgParams {
    return blendParams(this.from, this.to, smooth(this.morph));
  }

  /** Starts a 1-second morph to a new state. Re-targeting the current target does nothing. */
  setState(state: EcgState): void {
    if (state === this.target) return;
    this.from = this.params;
    this.to = ECG_PARAMS[state];
    this.target = state;
    this.morph = 0;
  }

  /** Advances time: scrolls the buffer and appends the new columns. `irregularity` 0–1 jitters the rhythm. */
  step(dt: number, irregularity = 0): void {
    if (this.morph < 1) this.morph = Math.min(1, this.morph + dt / MORPH_SECONDS);
    this.carry += dt * this.pxPerSecond;
    const n = Math.min(this.width, Math.floor(this.carry));
    if (n <= 0) return;
    this.carry -= n;
    this.columns.copyWithin(0, n);
    const p = this.params;
    const perColumn = 1 / this.pxPerSecond / (beatMs(p) / 1000);
    for (let i = this.width - n; i < this.width; i++) {
      // Irregular rhythm: the beat clock stutters, so intervals vary and beats bunch and stall.
      const stutter = irregularity > 0 ? 1 + irregularity * 0.8 * Math.sin(this.phase * 9.3 + 1.7) : 1;
      this.phase += perColumn * stutter;
      this.columns[i] = ecgSample(p, this.phase);
    }
  }

  /** Fills the strip with a still, representative stretch of one state (reduced motion; first paint). */
  fillStatic(state: EcgState): void {
    const p = ECG_PARAMS[state];
    const perColumn = 1 / this.pxPerSecond / (beatMs(p) / 1000);
    // Start a little before the P wave so the first complete beat sits well inside the strip.
    for (let i = 0; i < this.width; i++) this.columns[i] = ecgSample(p, 0.05 + i * perColumn);
    this.phase = 0.05 + this.width * perColumn;
    this.from = this.to = p;
    this.target = state;
    this.morph = 1;
  }

  /** Draws the strip: dark monitor background, faint grid, glowing trace. */
  draw(ctx: CanvasRenderingContext2D, colors: { trace: string; background: string; grid: string }): void {
    const { width, height } = this;
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 25) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = 0; y <= height; y += 25) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
    }
    ctx.stroke();
    const mid = height * 0.62;
    const scale = height * 0.5;
    ctx.strokeStyle = colors.trace;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.shadowColor = colors.trace;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = mid - this.columns[x] * scale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t);
