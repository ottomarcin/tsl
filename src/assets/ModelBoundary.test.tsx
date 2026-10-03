import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelBoundary } from './ModelBoundary';

function Thrower({ fail }: { fail: boolean }) {
  if (fail) throw new Error('load failed');
  return <p>loaded</p>;
}

function Suspender({ promise }: { promise: Promise<void> & { done?: boolean } }) {
  if (!promise.done) throw promise;
  return <p>ready</p>;
}

describe('ModelBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders children when nothing goes wrong', () => {
    render(<ModelBoundary><Thrower fail={false} /></ModelBoundary>);
    expect(screen.getByText('loaded')).toBeInTheDocument();
  });

  it('shows the fallback while a child suspends, then the child', async () => {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r)) as Promise<void> & { done?: boolean };
    render(<ModelBoundary fallback={<p>loading</p>}><Suspender promise={promise} /></ModelBoundary>);
    expect(screen.getByText('loading')).toBeInTheDocument();
    await act(async () => {
      promise.done = true;
      resolve();
    });
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument());
  });

  it('shows the error fallback and reports the error with a working retry', async () => {
    let fail = true;
    const onError = vi.fn();
    function Flaky() {
      return <Thrower fail={fail} />;
    }
    render(<ModelBoundary errorFallback={<p>broken</p>} onError={onError}><Flaky /></ModelBoundary>);
    expect(screen.getByText('broken')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toBe('load failed');
    fail = false;
    await act(async () => onError.mock.calls[0][1]());
    expect(screen.getByText('loaded')).toBeInTheDocument();
  });

  it('renders nothing on error when no errorFallback is given', () => {
    const { container } = render(<ModelBoundary><Thrower fail /></ModelBoundary>);
    expect(container).toBeEmptyDOMElement();
  });
});
