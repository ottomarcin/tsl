import { describe, expect, it } from 'vitest';
import { tlsEndCard } from './endCard';

describe('tlsEndCard', () => {
  it('has copy for every field the card shows', () => {
    for (const field of ['label', 'title', 'subtitle', 'body', 'replayLabel', 'sourcesLabel', 'restartLabel', 'replayTitle', 'sourcesTitle', 'credits', 'footer'] as const)
      expect(tlsEndCard[field].length).toBeGreaterThan(0);
  });
  it('does not claim a clinical review that has not happened', () => {
    expect(tlsEndCard.lastReview).toBeUndefined();
  });
});
