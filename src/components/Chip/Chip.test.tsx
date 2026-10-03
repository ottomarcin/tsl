import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Chip } from './Chip';

// jsdom has no PointerEvent, so fireEvent.pointerDown drops `pointerType`; attach it by hand.
function touchTap(el: HTMLElement) {
  fireEvent(el, Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' }));
  fireEvent.click(el);
}

describe('Chip', () => {
  it('renders label and value', () => {
    render(<Chip label="LDH" valueText="2.3× ULN" state="amber" />);
    expect(screen.getByRole('button', { name: /LDH/ })).toHaveTextContent('2.3× ULN');
  });

  it('renders a fill bar only when fill is provided, clamped to 0–100%', () => {
    const { container, rerender } = render(<Chip label="A" valueText="1" state="normal" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    rerender(<Chip label="A" valueText="1" state="normal" fill={1.7} />);
    expect((container.querySelector('[aria-hidden="true"] span') as HTMLElement).style.width).toBe('100%');
  });

  it('shows the reference range tooltip on focus', async () => {
    render(<Chip label="LDH" valueText="2.3× ULN" state="amber" reference="Amber above 2.0× ULN" />);
    await userEvent.tab();
    expect((await screen.findAllByText('Amber above 2.0× ULN')).length).toBeGreaterThan(0);
  });

  it('toggles the tooltip on touch tap, which Radix ignores by default', async () => {
    render(<Chip label="LDH" valueText="2.3× ULN" state="amber" reference="Amber above 2.0× ULN" />);
    const btn = screen.getByRole('button', { name: /LDH/ });
    touchTap(btn);
    
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    touchTap(btn);
    
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('is removed from tab order and disabled when inert', () => {
    render(<Chip label="LDH" valueText="x" state="normal" inert />);
    const btn = screen.getByRole('button', { name: /LDH/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('tabindex', '-1');
  });

  it('has no accessibility violations across states', async () => {
    const { container } = render(
      <div>
        <Chip label="A" valueText="1" state="normal" active={false} />
        <Chip label="B" valueText="2" state="amber" fill={0.5} reference="ref" />
        <Chip label="C" valueText="3" state="red" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
