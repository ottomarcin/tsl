import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { tlsEndCard } from '../../content/tls/endCard';
import { EndCard } from './EndCard';

const handlers = () => ({ onReplay: vi.fn(), onSources: vi.fn(), onRestart: vi.fn() });

describe('EndCard', () => {
  it('shows the copy of the design spec', () => {
    render(<EndCard content={tlsEndCard} {...handlers()} />);
    expect(screen.getByText('End of experience · 6 scenes complete')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tumor lysis syndrome' })).toBeInTheDocument();
    expect(screen.getByText('One trigger, three branches, two convergences, four intervention points.')).toBeInTheDocument();
    expect(screen.getByText(/replay any scene, review the underlying sources, or restart/)).toBeInTheDocument();
    expect(screen.getByText(/not a substitute for clinical judgment/)).toBeInTheDocument();
  });
  it('names the six guidelines the content was checked against', () => {
    render(<EndCard content={tlsEndCard} {...handlers()} />);
    for (const name of ['Cairo & Bishop 2004', 'Coiffier et al. JCO 2008', 'Howard et al. NEJM 2011', 'Jones et al. BJH 2015', 'Chan et al. BJH 2025', 'Arnaud et al. JASN 2022'])
      expect(screen.getByText(new RegExp(name.replace(/[.&]/g, '\\$&')))).toBeInTheDocument();
  });
  it('claims no clinical review until one has happened', () => {
    const { rerender } = render(<EndCard content={tlsEndCard} {...handlers()} />);
    expect(screen.queryByText(/Last clinical review/)).not.toBeInTheDocument();
    rerender(<EndCard content={{ ...tlsEndCard, lastReview: 'June 2026' }} {...handlers()} />);
    expect(screen.getByText(/Last clinical review: June 2026\./)).toBeInTheDocument();
  });
  it('has the three buttons, each calling its handler', async () => {
    const h = handlers();
    render(<EndCard content={tlsEndCard} {...h} />);
    await userEvent.click(screen.getByRole('button', { name: 'Replay any scene' }));
    await userEvent.click(screen.getByRole('button', { name: 'View sources' }));
    await userEvent.click(screen.getByRole('button', { name: 'Restart →' }));
    expect(h.onReplay).toHaveBeenCalledTimes(1);
    expect(h.onSources).toHaveBeenCalledTimes(1);
    expect(h.onRestart).toHaveBeenCalledTimes(1);
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<EndCard content={tlsEndCard} {...handlers()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
