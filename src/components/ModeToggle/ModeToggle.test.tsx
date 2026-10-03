import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import type { ModeToggle as ModeToggleDefinition } from '../../content/schema';
import { ModeToggle } from './ModeToggle';

const toggle: ModeToggleDefinition = {
  label: 'Injury mechanism',
  fromStep: 3,
  defaultId: 'a',
  options: [
    { id: 'a', label: 'Obstruction', hint: 'Crystals block flow.' },
    { id: 'b', label: 'Cytotoxicity', hint: 'Crystals injure cells.' },
    { id: 'c', label: 'Histone', badge: 'emerging', hint: 'Still emerging.' },
  ],
};

describe('ModeToggle', () => {
  it('renders one tab per option, with the active one selected', () => {
    render(<ModeToggle toggle={toggle} value="b" onChange={vi.fn()} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Cytotoxicity' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Obstruction' })).toHaveAttribute('aria-selected', 'false');
  });
  it('labels the group for assistive tech', () => {
    render(<ModeToggle toggle={toggle} value="a" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist', { name: 'Injury mechanism' })).toBeInTheDocument();
  });
  it('shows the qualifier badge and the active option\'s hint', () => {
    render(<ModeToggle toggle={toggle} value="c" onChange={vi.fn()} />);
    expect(screen.getByText('emerging')).toBeInTheDocument();
    expect(screen.getByText('Still emerging.')).toBeVisible();
    expect(screen.queryByText('Crystals block flow.')).toBeNull();
  });
  it('reports the clicked option', async () => {
    const onChange = vi.fn();
    render(<ModeToggle toggle={toggle} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Cytotoxicity' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
  it('is operable from the keyboard: arrows move focus, Enter selects', async () => {
    const onChange = vi.fn();
    render(<ModeToggle toggle={toggle} value="a" onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalledWith('b');
  });
  it('falls back to the first option for an unknown value', () => {
    render(<ModeToggle toggle={toggle} value="zzz" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Obstruction' })).toHaveAttribute('aria-selected', 'true');
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<ModeToggle toggle={toggle} value="a" onChange={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
