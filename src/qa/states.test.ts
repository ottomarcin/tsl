import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Design QA, visual: every clickable thing has a visible hover state and a focus ring, and nothing animates without a
 * reduced-motion rule (design spec §3.6.3, §9, §11).
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}
const modules = walk('src').filter((f) => f.endsWith('.module.css'));
const read = (f: string) => readFileSync(f, 'utf8');

/** Class names given `cursor: pointer` in a stylesheet. */
function clickableClasses(css: string): string[] {
  const names = new Set<string>();
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*cursor:\s*pointer[^{}]*)\}/g)) {
    for (const sel of rule[1].split(',')) {
      const m = sel.trim().match(/^(?:button)?\.([\w-]+)$/);
      if (m) names.add(m[1]);
    }
  }
  return [...names];
}

describe('hover and focus', () => {
  it('every clickable class has a :hover rule (or is a control whose state is shown another way)', () => {
    // Controls whose "hover" is the browser's own (native range/switch parts), or that react through a parent's rule.
    const EXEMPT = new Set(['thumb', 'switch', 'dot', 'slider']);
    const offenders: string[] = [];
    for (const f of modules) {
      const css = read(f);
      for (const cls of clickableClasses(css)) {
        if (EXEMPT.has(cls)) continue;
        if (!new RegExp(`\\.${cls}(\\[[^\\]]*\\])?:(hover|active|focus-visible)`).test(css) && !new RegExp(`\\.${cls}\\b[^{]*:hover`).test(css)) offenders.push(`${f}: .${cls}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the global focus ring is defined once, with the focus token, 2px wide', () => {
    expect(read('src/styles/global.css')).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--focus-ring\)/);
  });

  it('no stylesheet removes the focus outline without putting a visible ring back', () => {
    const offenders: string[] = [];
    for (const f of modules) {
      for (const rule of read(f).matchAll(/([^{}]+)\{([^{}]*outline:\s*(?:none|0)\b[^{}]*)\}/g)) {
        if (!/box-shadow|border/.test(rule[2]) && !/:focus-visible/.test(rule[1])) offenders.push(`${f}: ${rule[1].trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('reduced motion', () => {
  it('every stylesheet that animates or transitions for more than a blink has a prefers-reduced-motion rule, or is covered by the global one', () => {
    // global.css zeroes transition-duration under reduced motion for everything; keyframe animations need their own.
    expect(read('src/styles/global.css')).toMatch(/prefers-reduced-motion: reduce[\s\S]*transition-duration:\s*0ms/);
    const offenders = modules.filter((f) => /animation:\s*[^;]*\d+m?s/.test(read(f)) && !/prefers-reduced-motion/.test(read(f)));
    expect(offenders).toEqual([]);
  });
});
