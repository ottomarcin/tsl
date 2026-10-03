import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { MinimapToggle } from './MinimapToggle';

describe('MinimapToggle', () => {
  it('is a button named "Show cascade map" that opens a dialog', async () => {
    const onClick = vi.fn();
    render(<MinimapToggle onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Show cascade map' });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<MinimapToggle onClick={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
