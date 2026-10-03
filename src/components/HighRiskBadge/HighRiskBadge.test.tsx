import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { HighRiskBadge } from './HighRiskBadge';

describe('HighRiskBadge', () => {
  it('shows the supplied label when visible', () => {
    render(<HighRiskBadge label="HIGH RISK" visible />);
    expect(screen.getByRole('status')).toHaveTextContent('HIGH RISK');
    expect(screen.getByRole('status')).toHaveAttribute('data-visible', 'true');
  });

  it('is hidden from assistive tech when not visible', () => {
    render(<HighRiskBadge label="HIGH RISK" visible={false} />);
    expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts other states and reduced motion', () => {
    const { container } = render(<HighRiskBadge label="MODERATE" state="amber" visible reducedMotion />);
    expect(container.firstElementChild?.className).toMatch(/amber/);
    expect(container.firstElementChild?.className).toMatch(/still/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HighRiskBadge label="HIGH RISK" visible />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
