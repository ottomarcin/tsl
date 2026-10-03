import { describe, expect, it, vi } from 'vitest';
import { onModelError, reportModelError, retryModelErrors } from './loadErrors';

describe('model load errors', () => {
  it('tells every listener about a failure, until it unsubscribes', () => {
    const listener = vi.fn();
    const off = onModelError(listener);
    const error = new Error('404');
    reportModelError(error, () => {});
    expect(listener).toHaveBeenCalledWith(error);
    off();
    reportModelError(error, () => {});
    expect(listener).toHaveBeenCalledTimes(1);
    retryModelErrors();
  });
  it('retries each failed boundary once', () => {
    const a = vi.fn();
    const b = vi.fn();
    reportModelError(new Error('a'), a);
    reportModelError(new Error('b'), b);
    retryModelErrors();
    retryModelErrors();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
