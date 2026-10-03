import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

afterEach(() => vi.useRealTimers());

describe('Toast', () => {
  it('is an alert with the message', () => {
    render(<Toast message="Loading is taking too long." onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Loading is taking too long.');
  });
  it('shows its action and calls it', async () => {
    const onClick = vi.fn();
    render(<Toast message="m" action={{ label: 'Retry', onClick }} onDismiss={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('has no action button when it has no action', () => {
    render(<Toast message="m" onDismiss={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
  it('can be dismissed', async () => {
    const onDismiss = vi.fn();
    render(<Toast message="m" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  it('closes itself after the time given, and not before', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="m" autoDismissMs={8000} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(7999));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  it('stays up when it has no time', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="m" onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(60000));
    expect(onDismiss).not.toHaveBeenCalled();
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<Toast message="m" action={{ label: 'Retry', onClick: vi.fn() }} onDismiss={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
