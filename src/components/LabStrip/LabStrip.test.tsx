import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { LabStrip } from './LabStrip';
import { tlsMetrics } from '../../content/tls';

const values = { K: 4.2, Ca: 9.4, PO4: 3.5, UA: 5.0, Cr: 0.9 };

describe('LabStrip', () => {
  it('renders one cell per metric with label, tweened value, and unit', () => {
    render(
      <LabStrip
        metrics={tlsMetrics}
        values={values}
        currentStage={0}
        totalStages={6}
        onJumpToStage={vi.fn()}
        reducedMotion
      />,
    );
    expect(screen.getByText('K⁺')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getAllByText('mmol/L').length).toBeGreaterThan(0);
  });

  it('falls back to 0 for any metric missing from values', () => {
    render(
      <LabStrip metrics={tlsMetrics} values={{}} currentStage={0} totalStages={6} onJumpToStage={vi.fn()} reducedMotion />,
    );
    expect(screen.getAllByText('0.0').length).toBe(tlsMetrics.length);
  });

  it('renders the timestamp when provided', () => {
    render(
      <LabStrip
        metrics={tlsMetrics}
        values={values}
        timestamp="T+12h"
        currentStage={0}
        totalStages={6}
        onJumpToStage={vi.fn()}
      />,
    );
    expect(screen.getByText('T+12h')).toBeInTheDocument();
  });

  it('does not render a timestamp element when none is provided', () => {
    render(<LabStrip metrics={tlsMetrics} values={values} currentStage={0} totalStages={6} onJumpToStage={vi.fn()} />);
    expect(screen.queryByText(/^T\+/)).not.toBeInTheDocument();
  });

  it('wires the embedded StageProgress to onJumpToStage', async () => {
    const onJumpToStage = vi.fn();
    render(
      <LabStrip
        metrics={tlsMetrics}
        values={values}
        currentStage={0}
        totalStages={3}
        stageLabels={['A', 'B', 'C']}
        onJumpToStage={onJumpToStage}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'C' }));
    expect(onJumpToStage).toHaveBeenCalledWith(2);
  });

  it('applies a red flag and alert icon once a value crosses into the critical range', () => {
    render(
      <LabStrip
        metrics={tlsMetrics}
        values={{ ...values, UA: 10.2 }}
        currentStage={0}
        totalStages={6}
        onJumpToStage={vi.fn()}
        reducedMotion
      />,
    );
    expect(screen.getByText('10.2').closest('span')?.querySelector('svg')).toBeInTheDocument();
  });

  it('immediately reflects a new value with no animation when reducedMotion is set', () => {
    const { rerender } = render(
      <LabStrip
        metrics={tlsMetrics}
        values={values}
        currentStage={0}
        totalStages={6}
        onJumpToStage={vi.fn()}
        reducedMotion
      />,
    );
    rerender(
      <LabStrip
        metrics={tlsMetrics}
        values={{ ...values, K: 5.5 }}
        currentStage={0}
        totalStages={6}
        onJumpToStage={vi.fn()}
        reducedMotion
      />,
    );
    expect(screen.getByText('5.5')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <LabStrip
        metrics={tlsMetrics}
        values={values}
        timestamp="T+0h"
        currentStage={0}
        totalStages={6}
        stageLabels={['A', 'B', 'C', 'D', 'E', 'F']}
        onJumpToStage={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a legend button only when it is given something to open', async () => {
    const props = { metrics: tlsMetrics, values, currentStage: 0, totalStages: 6, onJumpToStage: vi.fn() };
    const { rerender } = render(<LabStrip {...props} />);
    expect(screen.queryByRole('button', { name: 'Colour legend' })).not.toBeInTheDocument();
    const onShowLegend = vi.fn();
    rerender(<LabStrip {...props} onShowLegend={onShowLegend} />);
    await userEvent.click(screen.getByRole('button', { name: 'Colour legend' }));
    expect(onShowLegend).toHaveBeenCalledTimes(1);
  });
});
