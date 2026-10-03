import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasBoundary } from './CanvasBoundary';

function Boom(): never {
  throw new Error('render failed');
}

afterEach(() => vi.restoreAllMocks());

describe('CanvasBoundary', () => {
  it('shows its children while they work', () => {
    render(<CanvasBoundary onTextOnly={vi.fn()}><p>scene</p></CanvasBoundary>);
    expect(screen.getByText('scene')).toBeInTheDocument();
  });
  it('replaces a crashed scene with a message and two ways forward', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onTextOnly = vi.fn();
    render(<CanvasBoundary onTextOnly={onTextOnly}><Boom /></CanvasBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('The 3D scene stopped working.');
    await userEvent.click(screen.getByRole('button', { name: 'Read it as text' }));
    expect(onTextOnly).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
  it('has no accessibility violations when it has failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<CanvasBoundary onTextOnly={vi.fn()}><Boom /></CanvasBoundary>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
