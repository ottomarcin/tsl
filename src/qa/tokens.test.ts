import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TOKENS } from '../lib/tokens';

/**
 * Design QA, visual (design spec §11): colours come from the token file, type is Inter and IBM Plex Mono only, and
 * spacing is on the 4-pt scale. Scans the source so a stray value fails here, not in review.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}
const files = walk('src');
const css = files.filter((f) => f.endsWith('.css') && !f.endsWith('tokens.css') && !f.endsWith('fonts.css'));
const code = files.filter((f) => /\.(ts|tsx)$/.test(f) && !/\.(test|stories)\./.test(f) && !f.startsWith('src/qa/') && !f.endsWith('lib/tokens.ts'));
const text = (f: string) => readFileSync(f, 'utf8');

describe('colours', () => {
  it('no stylesheet outside tokens.css has a raw colour value', () => {
    const offenders = css.flatMap((f) => (text(f).match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? []).map((m) => `${f}: ${m}`));
    expect(offenders).toEqual([]);
  });

  // Colours that are not design tokens and why. Everything else in code must be a token value (lib/tokens.ts).
  const NOT_TOKENS: Record<string, string> = {
    '#404448': 'three-light rig: ambient (asset spec §1.5)',
    '#e0e6f0': 'three-light rig: key light',
    '#f0c080': 'three-light rig: rim light',
    '#ffffff': 'neutral multiplier for a texture (white leaves the texture unchanged)',
    '#5d4878': 'placeholder cell material while the real model loads',
    '#2a2030': 'placeholder cell material (emissive)',
    '#7e8e9e': 'capillary wall material (Scene 3)',
    '#1f6fb2': 'filtrate particles on the pale canvas (Scene 3)',
    '#9dc8e8': 'filtrate particles on the dark canvas (Scene 3)',
    '#6b6a63': 'histone particles on the pale canvas (Scene 3)',
    '#c8c5bc': 'histone particles on the dark canvas (Scene 3)',
    '#8e8670': 'crystal trail, dimmed for the dark canvas (Scene 2)',
    '#f0d8a0': 'heat glow of the lysis origin (Scene 4)',
    '#e8b866': 'heat glow of the lysis origin, mid (Scene 4)',
  };
  const tokenValues = new Set([...Object.values(TOKENS.dark), ...Object.values(TOKENS.light)].map((v) => v.toLowerCase()));

  it('every colour written in code is a token value or one of the listed exceptions', () => {
    const offenders = code.flatMap((f) =>
      (text(f).match(/['"`]#[0-9a-fA-F]{6}['"`]/g) ?? [])
        .map((m) => m.slice(1, -1).toLowerCase())
        .filter((hex) => !tokenValues.has(hex) && !(hex in NOT_TOKENS))
        .map((hex) => `${f}: ${hex}`),
    );
    expect(offenders).toEqual([]);
  });

  it('the exceptions list has no entry that is no longer used (so it cannot rot)', () => {
    const used = new Set(code.flatMap((f) => (text(f).match(/['"`]#[0-9a-fA-F]{6}['"`]/g) ?? []).map((m) => m.slice(1, -1).toLowerCase())));
    expect(Object.keys(NOT_TOKENS).filter((hex) => !used.has(hex))).toEqual([]);
  });
});

describe('type', () => {
  it('every font-family is one of the two font tokens', () => {
    const offenders = css.flatMap((f) =>
      [...text(f).matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1].trim()).filter((v) => !/^var\(--font-(sans|mono)\)$/.test(v)).map((v) => `${f}: ${v}`),
    );
    expect(offenders).toEqual([]);
  });
  it('the 3D labels and canvases use the same two families', () => {
    const offenders = code.flatMap((f) => (text(f).match(/font(Family)?:\s*['"`][^'"`]*['"`]/g) ?? []).filter((m) => !/Inter|IBM Plex Mono|sans-serif|monospace/i.test(m)).map((m) => `${f}: ${m}`));
    expect(offenders).toEqual([]);
  });
  it('figures are tabular wherever the monospace face is used for numbers (the global .mono rule and the lab cells)', () => {
    expect(text('src/styles/fonts.css')).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(text('src/components/LabStrip/LabStrip.module.css')).toMatch(/tabular-nums/);
  });
});

describe('spacing', () => {
  // Properties whose pixel values must sit on the 4-pt scale. Strokes of up to 2px and sizes (widths, heights,
  // offsets of 3D-anchored labels) are not spacing.
  const PROPS = /^\s*(padding|padding-(?:top|right|bottom|left|inline|block)|margin|margin-(?:top|right|bottom|left|inline|block)|gap|row-gap|column-gap)\s*:\s*([^;]+);/gm;
  it('padding, margin and gap use only multiples of 4px (or tokens)', () => {
    const offenders: string[] = [];
    for (const f of css) {
      for (const m of text(f).matchAll(PROPS)) {
        const value = m[2].replace(/var\([^)]*\)/g, '').replace(/calc\([^)]*\)/g, '');
        for (const px of value.matchAll(/(-?\d*\.?\d+)px/g)) {
          const n = Math.abs(Number(px[1]));
          // 1px and 2px are hairlines and optical offsets (a stroke's width, a thumb centred in its track), not spacing.
          if (n > 2 && n % 4 !== 0) offenders.push(`${f}: ${m[1]}: ${m[2].trim()}`);
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });
});
