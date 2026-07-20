import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('shows a sun icon and offers to switch to light when currently dark', () => {
    render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Switch to light theme' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows a moon icon and offers to switch to dark when currently light', () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Switch to dark theme' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="dark" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations in either theme', async () => {
    const { container, rerender } = render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<ThemeToggle theme="light" onToggle={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
