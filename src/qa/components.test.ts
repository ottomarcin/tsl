import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Tech architecture §10: every component has its four files, and its stories show the default, every variant and a playground. */
const names = readdirSync('src/components', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

describe.each(names)('components/%s', (name) => {
  const dir = `src/components/${name}`;
  it('has a component, a stylesheet, a test and stories', () => {
    for (const file of [`${name}.tsx`, `${name}.module.css`, `${name}.test.tsx`, `${name}.stories.tsx`]) expect(existsSync(`${dir}/${file}`), file).toBe(true);
  });
  it('has Default, AllVariants and Playground stories', () => {
    const stories = readFileSync(`${dir}/${name}.stories.tsx`, 'utf8');
    for (const story of ['Default', 'AllVariants', 'Playground']) expect(stories, story).toMatch(new RegExp(`export const ${story}\\b`));
  });
  it('has an accessibility check in its tests (jest-axe)', () => {
    expect(readFileSync(`${dir}/${name}.test.tsx`, 'utf8')).toMatch(/toHaveNoViolations/);
  });
});
