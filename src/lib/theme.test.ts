import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { persistTheme, readDomTheme, resolveInitialTheme } from './theme';

function mockMatchMedia(prefersLight: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('light') ? prefersLight : !prefersLight,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('resolveInitialTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('prefers a stored value over system preference', () => {
    window.localStorage.setItem('theme', 'light');
    mockMatchMedia(false); // system says dark, stored says light
    expect(resolveInitialTheme()).toBe('light');
  });

  it('falls back to prefers-color-scheme when nothing is stored', () => {
    mockMatchMedia(true);
    expect(resolveInitialTheme()).toBe('light');
  });

  it('defaults to dark when nothing is stored and the system has no light preference', () => {
    mockMatchMedia(false);
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('ignores a corrupted stored value and falls back to system preference', () => {
    window.localStorage.setItem('theme', 'not-a-theme');
    mockMatchMedia(true);
    expect(resolveInitialTheme()).toBe('light');
  });

  it('defaults to dark when localStorage access throws', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mockMatchMedia(false);
    expect(resolveInitialTheme()).toBe('dark');
    getItemSpy.mockRestore();
  });
});

describe('readDomTheme / persistTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
  });

  it('reads whatever data-theme is currently set, defaulting to dark for anything else', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    expect(readDomTheme()).toBe('light');
    document.documentElement.setAttribute('data-theme', 'something-else');
    expect(readDomTheme()).toBe('dark');
  });

  it('persistTheme writes both localStorage and the data-theme attribute', () => {
    persistTheme('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persistTheme does not throw when localStorage is unavailable', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => persistTheme('dark')).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    setItemSpy.mockRestore();
  });
});
