import { useEffect, useRef } from 'react';
import { ECG_LABELS, type EcgState } from '../../lib/ecg';
import { EcgTrace } from '../../lib/ecgTrace';
import styles from './EcgCanvas.module.css';
import { token, tokenAlpha } from '../../lib/tokens';

export interface EcgCanvasProps {
  state: EcgState;
  width: number;
  height: number;
  /** False draws a still stretch of the rhythm instead of a scrolling trace (reduced motion). */
  animated?: boolean;
  /** 0–1 irregularity added to the rhythm (ventricular dysrhythmia). */
  irregularity?: number;
  theme?: 'dark' | 'light';
}

export interface MonitorColors {
  trace: string;
  background: string;
  grid: string;
}

/**
 * Colours of the monitor. The design spec keeps the strip dark in both themes, like a real monitor; in the light theme
 * that reads as a black hole in a pale page, so it follows the theme instead (the same trace green as the page's
 * `--monitor-trace`, on the page's own surface colour).
 */
export const MONITOR_COLORS: Record<'dark' | 'light', MonitorColors> = {
  dark: { trace: token('--monitor-trace', 'dark'), background: token('--bg-canvas', 'dark'), grid: tokenAlpha('--text-muted', 0.16, 'dark') },
  light: { trace: token('--monitor-trace', 'light'), background: token('--bg-surface', 'light'), grid: tokenAlpha('--text-muted', 0.14, 'light') },
};

/**
 * Scrolling ECG strip (design spec §6.10): morphs smoothly into whatever state it is given over one second. The
 * waveform data and scrolling live in `EcgTrace`; this is the DOM wrapper around it.
 */
export function EcgCanvas({ state, width, height, animated = true, irregularity = 0, theme = 'dark' }: EcgCanvasProps) {
  const colors = MONITOR_COLORS[theme];
  const canvas = useRef<HTMLCanvasElement>(null);
  const trace = useRef<EcgTrace | null>(null);
  const live = useRef({ state, irregularity });
  live.current = { state, irregularity };

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return; // no 2D canvas (tests, very old browsers): the labelled box stays
    const t = new EcgTrace({ width, height, initialState: live.current.state });
    trace.current = t;
    if (!animated) {
      t.fillStatic(live.current.state);
      t.draw(ctx, colors);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t.setState(live.current.state);
      t.step(dt, live.current.irregularity);
      t.draw(ctx, colors);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height, animated, colors]);

  // A still strip follows the state directly (there is no animation loop to do it).
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (animated || !trace.current || !ctx) return;
    trace.current.fillStatic(state);
    trace.current.draw(ctx, colors);
  }, [state, animated, colors]);

  return (
    <div className={styles.frame} style={{ width, height, background: colors.background }}>
      <canvas ref={canvas} className={styles.canvas} width={width} height={height} role="img" aria-label={`ECG trace: ${ECG_LABELS[state]}`} />
    </div>
  );
}
