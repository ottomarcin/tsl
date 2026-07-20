import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { StageProgress } from './StageProgress';

describe('StageProgress', () => {
  it('renders one dot per stage', () => {
    render(<StageProgress current={2} total={6} onJump={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('marks the current dot with aria-current', () => {
    render(<StageProgress current={2} total={6} labels={['A', 'B', 'C', 'D', 'E', 'F']} onJump={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'B' })).not.toHaveAttribute('aria-current');
  });

  it('calls onJump with the clicked index', async () => {
    const onJump = vi.fn();
    render(<StageProgress current={0} total={6} labels={['A', 'B', 'C', 'D', 'E', 'F']} onJump={onJump} />);
    await userEvent.click(screen.getByRole('button', { name: 'D' }));
    expect(onJump).toHaveBeenCalledWith(3);
  });

  it('falls back to a generic label when none is provided', () => {
    render(<StageProgress current={0} total={3} onJump={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Scene 1' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <StageProgress current={2} total={6} labels={['A', 'B', 'C', 'D', 'E', 'F']} onJump={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
