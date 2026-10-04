import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumb } from './Breadcrumb';

const items = (onSelect = vi.fn()) => [
  { marker: '2', label: 'Metabolic cascade', onSelect },
  { marker: '2.3', label: 'Phosphate binds calcium' },
];

describe('Breadcrumb', () => {
  it('shows the scene, then the step, and marks the step as the current location', () => {
    render(<Breadcrumb items={items()} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toHaveTextContent('2Metabolic cascade');
    expect(nav).toHaveTextContent('2.3Phosphate binds calcium');
    expect(screen.getByText('Phosphate binds calcium').closest('[aria-current]')).toHaveAttribute('aria-current', 'location');
  });

  it('makes a parent a button that takes you back up, and the last item plain text', async () => {
    const onSelect = vi.fn();
    render(<Breadcrumb items={items(onSelect)} />);
    await userEvent.click(screen.getByRole('button', { name: /Metabolic cascade/ }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('renders nothing without items', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Breadcrumb items={items()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
