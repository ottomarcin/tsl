import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { LandingScreen } from './LandingScreen';
import { tlsLanding } from '../../content/tls';

const baseProps = {
  content: tlsLanding,
  theme: 'dark' as const,
  onToggleTheme: vi.fn(),
  webglSupported: true,
  onBegin: vi.fn(),
};

describe('LandingScreen', () => {
  it('renders the exact copy from the content package', () => {
    render(<LandingScreen {...baseProps} />);
    expect(screen.getByText(tlsLanding.label)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: tlsLanding.title })).toBeInTheDocument();
    expect(screen.getByText(tlsLanding.subtitle)).toBeInTheDocument();
    expect(screen.getByText(tlsLanding.body)).toBeInTheDocument();
    expect(screen.getByText(tlsLanding.meta)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: tlsLanding.ctaLabel })).toBeInTheDocument();
  });

  it('calls onBegin when the CTA is clicked', async () => {
    const onBegin = vi.fn();
    render(<LandingScreen {...baseProps} onBegin={onBegin} />);
    await userEvent.click(screen.getByRole('button', { name: tlsLanding.ctaLabel }));
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleTheme when the theme toggle is clicked', async () => {
    const onToggleTheme = vi.fn();
    render(<LandingScreen {...baseProps} onToggleTheme={onToggleTheme} />);
    await userEvent.click(screen.getByRole('button', { name: /switch to/i }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('shows a disabled, loading CTA and no slow-load message before the threshold', () => {
    render(<LandingScreen {...baseProps} loading />);
    const button = screen.getByRole('button', { name: 'Loading…' });
    expect(button).toBeDisabled();
    expect(screen.queryByText(tlsLanding.slowLoadMessage)).not.toBeInTheDocument();
  });

  it('shows the slow-load message once loading exceeds the threshold', () => {
    render(<LandingScreen {...baseProps} loading showSlowLoadMessage />);
    expect(screen.getByText(tlsLanding.slowLoadMessage)).toBeInTheDocument();
  });

  it('replaces the CTA entirely with the WebGL-unsupported message when unsupported', () => {
    render(<LandingScreen {...baseProps} webglSupported={false} />);
    expect(screen.getByTestId('webgl-unsupported')).toBeInTheDocument();
    expect(screen.getByText(tlsLanding.webglUnsupportedMessage)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: tlsLanding.ctaLabel })).not.toBeInTheDocument();
  });

  it('has no accessibility violations in the default, loading, or unsupported states', async () => {
    const { container, rerender } = render(<LandingScreen {...baseProps} />);
    expect(await axe(container)).toHaveNoViolations();

    rerender(<LandingScreen {...baseProps} loading showSlowLoadMessage />);
    expect(await axe(container)).toHaveNoViolations();

    rerender(<LandingScreen {...baseProps} webglSupported={false} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
