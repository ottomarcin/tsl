import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { FirstRunScrollHint } from './FirstRunScrollHint';

describe('FirstRunScrollHint', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<FirstRunScrollHint visible={false} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the "Scroll to begin" label when visible', () => {
    render(<FirstRunScrollHint visible onDismiss={vi.fn()} />);
    expect(screen.getByText('Scroll to begin')).toBeInTheDocument();
  });

  it('calls onDismiss when the close button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<FirstRunScrollHint visible onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<FirstRunScrollHint visible onDismiss={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
