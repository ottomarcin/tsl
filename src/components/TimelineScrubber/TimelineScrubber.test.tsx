import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { TimelineScrubber } from './TimelineScrubber';

const base = { value: 0.5, onChange: vi.fn(), startLabel: 'T+0h', endLabel: 'T+48h', currentLabel: 'T+24h', ariaLabel: 'Time since lysis began' };

describe('TimelineScrubber', () => {
  it('shows both ends and the current time', () => {
    render(<TimelineScrubber {...base} />);
    expect(screen.getByText('T+0h')).toBeInTheDocument();
    expect(screen.getByText('T+48h')).toBeInTheDocument();
    expect(screen.getByText('T+24h')).toBeInTheDocument();
  });
  it('is a slider with the time as its value text', () => {
    render(<TimelineScrubber {...base} />);
    const slider = screen.getByRole('slider', { name: 'Time since lysis began' });
    expect(slider).toHaveAttribute('aria-valuetext', 'T+24h');
    expect(slider).toHaveAttribute('aria-valuenow', '0.5');
  });
  it('reports the new position from the keyboard', async () => {
    const onChange = vi.fn();
    render(<TimelineScrubber {...base} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith(0.49);
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<TimelineScrubber {...base} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
