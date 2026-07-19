import { describe, expect, it } from 'vitest';
import { allTlsCitations, cite } from './citations';
import { tlsContent } from './index';

describe('citations', () => {
  it('resolves known ids to their citation objects', () => {
    expect(cite('1')).toEqual([{ id: '1', text: expect.stringContaining('Howard SC') }]);
  });

  it('throws on an unknown citation id, catching typos rather than silently returning nothing', () => {
    expect(() => cite('999')).toThrow(/Unknown citation id/);
  });

  it('exposes exactly the 18 references from the scenario script bibliography', () => {
    expect(allTlsCitations).toHaveLength(18);
    expect(new Set(allTlsCitations.map((c) => c.id)).size).toBe(18);
  });

  it('never uses a citation id outside the known 1–18 registry anywhere in the scene content', () => {
    const knownIds = new Set(allTlsCitations.map((c) => c.id));
    for (const scene of tlsContent.scenes) {
      for (const step of scene.steps) {
        for (const citation of step.learnMore?.citations ?? []) {
          expect(knownIds.has(citation.id)).toBe(true);
        }
      }
    }
  });
});
