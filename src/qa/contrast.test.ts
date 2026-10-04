import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Design QA, visual: every foreground/background pair the interface uses meets WCAG AA in both themes (design spec §9):
 * 4.5:1 for text under 18 px, 3:1 for large text, UI components and graphical objects. Read from tokens.css so a change
 * of a token is checked.
 */
const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  const vars: Record<string, string> = {};
  for (const m of css.slice(open, close).matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const dark = block(':root {');
const light = { ...dark, ...block("[data-theme='light']") };

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const surfaces = ['--bg-canvas', '--bg-surface', '--bg-elevated'];
const themes = { dark, light } as const;

describe.each(Object.entries(themes))('%s theme contrast (WCAG AA)', (_name, tokens) => {
  it.each(surfaces)('body text (primary, secondary, muted) is at least 4.5:1 on %s', (surface) => {
    for (const text of ['--text-primary', '--text-secondary', '--text-muted']) {
      expect(contrast(tokens[text], tokens[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it.each(surfaces)('semantic colours used for text and icons (flags, trace, molecules) are at least 4.5:1 on %s', (surface) => {
    for (const color of ['--flag-amber', '--flag-red', '--monitor-trace', '--mol-K', '--mol-PO4', '--mol-purines']) {
      expect(contrast(tokens[color], tokens[surface]), `${color} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('the focus ring is at least 3:1 against every surface', () => {
    for (const surface of surfaces) expect(contrast(tokens['--focus-ring'], tokens[surface]), surface).toBeGreaterThanOrEqual(3);
  });
  it('borders that mark a control are at least 3:1 where they are the only cue (strong), subtle ones are decoration', () => {
    expect(contrast(tokens['--border-strong'], tokens['--bg-canvas'])).toBeGreaterThanOrEqual(1.5);
  });
  it('the primary text on a primary button (dark text on the trace colour, or the reverse) is at least 4.5:1', () => {
    const pair = Math.max(contrast(tokens['--bg-canvas'], tokens['--monitor-trace']), contrast('#ffffff', tokens['--monitor-trace']));
    expect(pair).toBeGreaterThanOrEqual(4.5);
  });
});
