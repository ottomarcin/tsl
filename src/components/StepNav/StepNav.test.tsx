import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { StepNav } from './StepNav';

const setup = (props = {}) => {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  render(
    <StepNav
      previous={{ marker: '2.2', label: 'Potassium rises' }}
      next={{ marker: '2.4', label: 'Uric acid' }}
      onPrevious={onPrevious}
      onNext={onNext}
      {...props}
    />,
  );
  return { onPrevious, onNext };
};

describe('StepNav', () => {
  it('names where each button goes', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Previous step: 2.2 Potassium rises' })).toHaveAttribute('title', 'Previous: 2.2 Potassium rises');
    expect(screen.getByRole('button', { name: 'Next step: 2.4 Uric acid' })).toBeEnabled();
  });

  it('calls the handlers', async () => {
    const { onPrevious, onNext } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^Previous step/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Next step/ }));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('disables a button with nowhere to go', () => {
    setup({ previous: null });
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  });

  it('describes a target without a marker (the end card) by its label', () => {
    setup({ next: { label: 'End card' } });
    expect(screen.getByRole('button', { name: 'Next step: End card' })).toBeEnabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<StepNav previous={null} next={{ marker: '1.1', label: 'A' }} onPrevious={vi.fn()} onNext={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
