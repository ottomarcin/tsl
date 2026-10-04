import { describe, expect, it } from 'vitest';
import { TOKENS, token, tokenAlpha } from './tokens';

describe('tokens as values', () => {
  it('reads the dark values from :root and the light overrides from [data-theme="light"]', () => {
    expect(token('--bg-canvas', 'dark')).toBe('#0b0e12');
    expect(token('--bg-canvas', 'light')).toBe('#fafaf7');
    expect(token('--space-4', 'light')).toBe('16px');
  });
  it('falls back to the dark value for a token a theme does not override', () => {
    expect(token('--crystal', 'dark')).not.toBe(token('--crystal', 'light'));
    expect(TOKENS.light['--bg-overlay']).not.toBe(TOKENS.dark['--bg-overlay']);
    expect(TOKENS.light['--radius-card']).toBe(TOKENS.dark['--radius-card']);
  });
  it('defaults to the dark theme', () => {
    expect(token('--text-primary')).toBe(token('--text-primary', 'dark'));
  });
  it('throws for a token that does not exist, catching typos', () => {
    expect(() => token('--nope')).toThrow(/Unknown design token/);
  });
  it('turns a colour token into rgba', () => {
    expect(tokenAlpha('--bg-canvas', 0.5)).toBe('rgba(11, 14, 18, 0.5)');
  });
});
