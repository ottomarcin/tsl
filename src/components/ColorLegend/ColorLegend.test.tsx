import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ColorLegend } from './ColorLegend';

const items = [
  { colorToken: '--mol-K', label: 'K⁺' },
  { colorToken: '--mol-PO4', label: 'PO₄' },
  { colorToken: '--mol-Ca', label: 'Ca²⁺' },
  { colorToken: '--mol-purines', label: 'Purines' },
  { colorToken: '--crystal', label: 'Crystals' },
  { colorToken: '--monitor-trace', label: 'Monitor', indicator: 'line' as const },
  { colorToken: '--flag-red', label: 'Flagged', indicator: 'line' as const },
];

describe('ColorLegend', () => {
  it('shows only the "Legend" label and mini dots when collapsed', () => {
    render(<ColorLegend items={items} expanded={false} onToggleExpanded={vi.fn()} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.queryByText('K⁺')).not.toBeInTheDocument();
  });

  it('shows every item label when expanded', () => {
    render(<ColorLegend items={items} expanded onToggleExpanded={vi.fn()} />);
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it('calls onToggleExpanded when tapped, in either state', async () => {
    const onToggleExpanded = vi.fn();
    const { rerender } = render(<ColorLegend items={items} expanded={false} onToggleExpanded={onToggleExpanded} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);

    rerender(<ColorLegend items={items} expanded onToggleExpanded={onToggleExpanded} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggleExpanded).toHaveBeenCalledTimes(2);
  });

  it('reflects expanded state via aria-expanded', () => {
    const { rerender } = render(<ColorLegend items={items} expanded={false} onToggleExpanded={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    rerender(<ColorLegend items={items} expanded onToggleExpanded={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no accessibility violations collapsed or expanded', async () => {
    const { container, rerender } = render(<ColorLegend items={items} expanded={false} onToggleExpanded={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<ColorLegend items={items} expanded onToggleExpanded={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
