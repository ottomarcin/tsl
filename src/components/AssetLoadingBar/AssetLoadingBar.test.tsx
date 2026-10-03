import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { AssetLoadingBar } from './AssetLoadingBar';

describe('AssetLoadingBar', () => {
  it('renders nothing when idle', () => {
    const { container } = render(<AssetLoadingBar active={false} progress={50} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('exposes progress as a progressbar and fills to that width', () => {
    render(<AssetLoadingBar active progress={42} />);
    const bar = screen.getByRole('progressbar', { name: 'Loading 3D models' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('42%');
  });
  it('clamps out-of-range progress', () => {
    const { rerender } = render(<AssetLoadingBar active progress={180} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<AssetLoadingBar active progress={-5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<AssetLoadingBar active progress={60} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
