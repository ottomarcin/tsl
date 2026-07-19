import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';

// jsdom has no real WebGL, so the default environment naturally exercises the
// unsupported-browser branch — that's the meaningful, unmocked path to test.
// The WebGL-supported branch is verified by mocking useWebGLSupport and
// stubbing out ScrollCanvas, since mounting a real @react-three/fiber Canvas
// against jsdom's absent WebGL implementation isn't something a DOM-level
// component test can exercise meaningfully (the R3F test-renderer smoke test
// and a manual browser check cover that instead — see engine/ScrollCanvas.test.tsx
// and tls_technical_architecture.md's verification section).

describe('App', () => {
  afterEach(() => {
    vi.resetModules();
    document.documentElement.removeAttribute('data-theme');
    window.history.replaceState(null, '', '/');
  });

  it('renders the WebGL-unsupported message without throwing when WebGL is unavailable', async () => {
    const { App } = await import('./App');
    const { container } = render(<App />);
    expect(screen.getByTestId('webgl-unsupported')).toBeInTheDocument();
    expect(screen.getByText(/requires WebGL/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders the scroll canvas shell when WebGL is supported', async () => {
    vi.doMock('./hooks', async (importOriginal) => {
      const actual = await importOriginal<typeof import('./hooks')>();
      return { ...actual, useWebGLSupport: () => true };
    });
    vi.doMock('./engine/ScrollCanvas', () => ({
      ScrollCanvas: () => <div data-testid="mock-scroll-canvas" />,
    }));

    const { App } = await import('./App');
    render(<App />);

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByTestId('mock-scroll-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('webgl-unsupported')).not.toBeInTheDocument();
  });
});
