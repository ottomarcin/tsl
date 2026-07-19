import { describe, expect, it } from 'vitest';
import { parsePathname, routeToPathname } from './routing';

describe('parsePathname / routeToPathname round-trip', () => {
  it('round-trips the landing route', () => {
    expect(parsePathname('/')).toEqual({ kind: 'landing' });
    expect(routeToPathname({ kind: 'landing' })).toBe('/');
  });

  it('round-trips every scene route 0 through 5', () => {
    for (let i = 0; i < 6; i++) {
      expect(parsePathname(`/scene/${i}`)).toEqual({ kind: 'scene', index: i });
      expect(routeToPathname({ kind: 'scene', index: i })).toBe(`/scene/${i}`);
    }
  });

  it('round-trips the end route', () => {
    expect(parsePathname('/end')).toEqual({ kind: 'end' });
    expect(routeToPathname({ kind: 'end' })).toBe('/end');
  });

  it('falls back to landing for a scene index out of range', () => {
    expect(parsePathname('/scene/6')).toEqual({ kind: 'landing' });
    expect(parsePathname('/scene/99')).toEqual({ kind: 'landing' });
  });

  it('falls back to landing for any unrecognized path', () => {
    expect(parsePathname('/nonsense')).toEqual({ kind: 'landing' });
    expect(parsePathname('/scene/abc')).toEqual({ kind: 'landing' });
    expect(parsePathname('')).toEqual({ kind: 'landing' });
  });
});
