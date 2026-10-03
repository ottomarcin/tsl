import { afterEach, describe, expect, it, vi } from 'vitest';
import { persistTextOnly, resolveInitialTextOnly } from './accessibility';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('text-only mode persistence', () => {
  it('is off until chosen, and remembers the choice', () => {
    expect(resolveInitialTextOnly()).toBe(false);
    persistTextOnly(true);
    expect(resolveInitialTextOnly()).toBe(true);
    persistTextOnly(false);
    expect(resolveInitialTextOnly()).toBe(false);
  });
  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(resolveInitialTextOnly()).toBe(false);
    expect(() => persistTextOnly(true)).not.toThrow();
  });
});
