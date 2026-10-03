import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { AccessibilityToggle } from './AccessibilityToggle';

describe('AccessibilityToggle', () => {
  it('is a toggle button named "Text-only mode", pressed when the text version is showing', () => {
    const { rerender } = render(<AccessibilityToggle textOnly={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Text-only mode' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<AccessibilityToggle textOnly onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Text-only mode' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('calls back on click and on the keyboard', async () => {
    const onToggle = vi.fn();
    render(<AccessibilityToggle textOnly={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<AccessibilityToggle textOnly onToggle={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
