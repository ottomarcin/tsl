import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { QualityToggle } from './QualityToggle';

describe('QualityToggle', () => {
  it('is pressed and offers standard quality when on high', () => {
    render(<QualityToggle quality="high" onToggle={vi.fn()} />);
    const b = screen.getByRole('button', { name: /switch to standard quality/i });
    expect(b).toHaveAttribute('aria-pressed', 'true');
  });
  it('is not pressed and offers high quality when on standard', () => {
    render(<QualityToggle quality="standard" onToggle={vi.fn()} />);
    const b = screen.getByRole('button', { name: /switch to high quality/i });
    expect(b).toHaveAttribute('aria-pressed', 'false');
  });
  it('calls onToggle on click', async () => {
    const onToggle = vi.fn();
    render(<QualityToggle quality="high" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
  it('has no accessibility violations in either state', async () => {
    const { container, rerender } = render(<QualityToggle quality="high" onToggle={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<QualityToggle quality="standard" onToggle={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
