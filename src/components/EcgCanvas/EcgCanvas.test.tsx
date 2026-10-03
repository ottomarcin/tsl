import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EcgCanvas, MONITOR_COLORS } from './EcgCanvas';

afterEach(() => vi.restoreAllMocks());

function fakeContext() {
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, prop: string) => () => calls.push(prop),
    set: () => true,
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

describe('EcgCanvas', () => {
  it('is a labelled image of the current rhythm', () => {
    const { rerender } = render(<EcgCanvas state="peaked_t" width={240} height={80} />);
    expect(screen.getByRole('img', { name: 'ECG trace: Peaked T waves' })).toBeInTheDocument();
    rerender(<EcgCanvas state="sine_wave" width={240} height={80} />);
    expect(screen.getByRole('img', { name: 'ECG trace: Sine wave' })).toBeInTheDocument();
  });

  it('has the requested size', () => {
    render(<EcgCanvas state="normal_sinus" width={240} height={80} />);
    const c = screen.getByRole('img') as HTMLCanvasElement;
    expect(c.width).toBe(240);
    expect(c.height).toBe(80);
  });

  it('survives a browser with no 2D canvas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => render(<EcgCanvas state="normal_sinus" width={240} height={80} />)).not.toThrow();
  });

  it('draws a still strip once when not animated, and redraws it when the state changes', () => {
    const { ctx, calls } = fakeContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
    const { rerender } = render(<EcgCanvas state="normal_sinus" width={240} height={80} animated={false} />);
    const fills = () => calls.filter((c) => c === 'fillRect').length;
    expect(fills()).toBeGreaterThanOrEqual(1);
    const before = fills();
    rerender(<EcgCanvas state="qrs_wide" width={240} height={80} animated={false} />);
    expect(fills()).toBeGreaterThan(before);
  });

  it('keeps redrawing while animated, and stops when unmounted', async () => {
    const { ctx, calls } = fakeContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
    let tick: ((t: number) => void) | null = null;
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      tick = cb;
      return 1;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const { unmount } = render(<EcgCanvas state="normal_sinus" width={240} height={80} />);
    expect(raf).toHaveBeenCalled();
    tick!(performance.now() + 16);
    tick!(performance.now() + 32);
    expect(calls.filter((c) => c === 'fillRect').length).toBeGreaterThanOrEqual(2);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it('follows the theme: a dark monitor on the dark page, a pale one on the light page', () => {
    const fills: unknown[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (_t, prop: string) => () => void prop,
      set: (_t, prop: string, value: unknown) => {
        if (prop === 'fillStyle') fills.push(value);
        return true;
      },
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
    const { rerender, container } = render(<EcgCanvas state="normal_sinus" width={120} height={60} animated={false} theme="dark" />);
    expect(fills.at(-1)).toBe(MONITOR_COLORS.dark.background);
    expect((container.firstElementChild as HTMLElement).style.background).toContain('11, 14, 18');
    rerender(<EcgCanvas state="normal_sinus" width={120} height={60} animated={false} theme="light" />);
    expect(fills.at(-1)).toBe(MONITOR_COLORS.light.background);
    expect(MONITOR_COLORS.light.background.toLowerCase()).not.toBe(MONITOR_COLORS.dark.background.toLowerCase());
    expect(MONITOR_COLORS.light.trace).not.toBe(MONITOR_COLORS.dark.trace);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EcgCanvas state="qrs_wide" width={240} height={80} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
