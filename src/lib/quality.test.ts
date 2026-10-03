import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { persistQuality, resolveInitialQuality } from './quality';

describe('resolveInitialQuality', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('defaults to high', () => {
    expect(resolveInitialQuality('')).toBe('high');
  });
  it('uses the saved choice', () => {
    persistQuality('standard');
    expect(resolveInitialQuality('')).toBe('standard');
  });
  it('lets the URL override the saved choice', () => {
    persistQuality('standard');
    expect(resolveInitialQuality('?quality=high')).toBe('high');
    persistQuality('high');
    expect(resolveInitialQuality('?x=1&quality=standard')).toBe('standard');
  });
  it('ignores junk in the URL and in storage', () => {
    window.localStorage.setItem('modelQuality', 'ultra');
    expect(resolveInitialQuality('?quality=ultra')).toBe('high');
  });
  it('survives unavailable localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(resolveInitialQuality('')).toBe('high');
    expect(() => persistQuality('standard')).not.toThrow();
  });
});
