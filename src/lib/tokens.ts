import tokensCss from '../styles/tokens.css?raw';
import type { Theme } from '../store/types';

/**
 * The colour tokens as values, for the places CSS variables cannot reach (three.js materials and lights, the 2D canvas
 * of the ECG). They are read from tokens.css itself, so the file stays the single source: change a token and the 3D
 * follows. (Reading the computed style instead would race the theme switch: React renders before the attribute lands.)
 */
function parse(block: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

function blockAfter(selector: string): string {
  const open = tokensCss.indexOf('{', tokensCss.indexOf(selector));
  return tokensCss.slice(open, tokensCss.indexOf('\n}', open));
}

const dark = parse(blockAfter(':root {'));
export const TOKENS: Record<Theme, Record<string, string>> = { dark, light: { ...dark, ...parse(blockAfter("[data-theme='light']")) } };

/** The value of a token in a theme, e.g. `token('--flag-red', 'dark')` → '#db6841'. */
export function token(name: string, theme: Theme = 'dark'): string {
  const value = TOKENS[theme][name];
  if (value === undefined) throw new Error(`Unknown design token ${name}`);
  return value;
}

/** A token as an rgba() string with the given alpha (for canvas drawing). */
export function tokenAlpha(name: string, alpha: number, theme: Theme = 'dark'): string {
  const hex = token(name, theme).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
