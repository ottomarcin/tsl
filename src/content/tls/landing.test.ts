import { describe, expect, it } from 'vitest';
import { tlsLanding } from './landing';

describe('tlsLanding', () => {
  it('has non-empty copy for every required field', () => {
    const fields: (keyof typeof tlsLanding)[] = [
      'label',
      'title',
      'subtitle',
      'body',
      'ctaLabel',
      'meta',
      'slowLoadMessage',
      'webglUnsupportedMessage',
    ];
    for (const field of fields) {
      expect(tlsLanding[field].length).toBeGreaterThan(0);
    }
  });

  it('titles the experience "Tumor Lysis Syndrome", per the design spec', () => {
    expect(tlsLanding.title).toBe('Tumor Lysis Syndrome');
  });
});
