import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tlsContent } from './content/tls';

// jsdom has no real WebGL, so the default environment naturally exercises the
// unsupported-browser branch. The WebGL-supported branch is verified by
// mocking useWebGLSupport and stubbing out ScrollCanvas, since mounting a
// real @react-three/fiber Canvas against jsdom's absent WebGL implementation
// isn't something a DOM-level component test can exercise meaningfully (the
// R3F test-renderer smoke test and a manual browser check cover that instead
// — see engine/ScrollCanvas.test.tsx and tls_technical_architecture.md).
//
// Every test dynamically re-imports both `App` and `useAppStore` together,
// after any vi.doMock calls, from the same freshly-reset module registry —
// mixing a module-scope static `useAppStore` import with dynamically
// re-imported `App` instances (each built on a `vi.resetModules()`-cleared
// registry) would silently produce two different store singletons.

async function setUpApp(webglSupported: boolean) {
  if (webglSupported) {
    vi.doMock('./hooks', async (importOriginal) => {
      const actual = await importOriginal<typeof import('./hooks')>();
      return { ...actual, useWebGLSupport: () => true };
    });
    vi.doMock('./engine/ScrollCanvas', () => ({
      ScrollCanvas: () => <div data-testid="mock-scroll-canvas" />,
    }));
  }
  const { App } = await import('./App');
  const { useAppStore } = await import('./store/useAppStore');
  return { App, useAppStore };
}

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('./hooks');
    vi.doUnmock('./engine/ScrollCanvas');
    document.documentElement.removeAttribute('data-theme');
  });

  it('shows the WebGL-unsupported message when WebGL is unavailable, regardless of route', async () => {
    const { App } = await setUpApp(false);
    const { container } = render(<App />);
    expect(screen.getByTestId('webgl-unsupported')).toBeInTheDocument();
    expect(screen.getByText(/requires WebGL/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows the landing screen when WebGL is supported and the route is landing', async () => {
    const { App } = await setUpApp(true);
    render(<App />);

    expect(screen.getByRole('button', { name: tlsContent.landing.ctaLabel })).toBeInTheDocument();
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
  });

  it('clicking Begin on the landing screen navigates to Scene 0', async () => {
    const { App, useAppStore } = await setUpApp(true);
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: tlsContent.landing.ctaLabel }));

    expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 0 });
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByTestId('mock-scroll-canvas')).toBeInTheDocument();
  });

  it('shows the persistent chrome + scroll canvas when the route is a scene', async () => {
    window.history.replaceState(null, '', '/scene/2');
    const { App } = await setUpApp(true);
    const { container } = render(<App />);

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByTestId('mock-scroll-canvas')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Scene navigation' });
    expect(within(nav).getByRole('button', { name: /cascade/i })).toHaveAttribute('aria-current', 'step');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows the cascade minimap from Scene 3 onward but not before', async () => {
    window.history.replaceState(null, '', '/scene/1');
    const { App, useAppStore } = await setUpApp(true);
    const { rerender } = render(<App />);
    // Query by the minimap's own accessible role, not a bare `svg` selector —
    // SideNav's Lucide icons (Check/Circle) are also <svg> elements.
    expect(screen.queryByRole('img', { name: 'Cascade progress minimap' })).not.toBeInTheDocument();

    await act(async () => {
      useAppStore.getState().jumpToScene(3, { source: 'nav' });
    });
    rerender(<App />);
    expect(screen.getByRole('img', { name: 'Cascade progress minimap' })).toBeInTheDocument();
  });

  it('shows a placeholder for the end card when the route is /end', async () => {
    window.history.replaceState(null, '', '/end');
    const { App } = await setUpApp(true);
    render(<App />);
    // SideNav also has an "End card" nav item, so match the placeholder's exact copy, not a substring.
    expect(screen.getByText('End card — Epic 9')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-scroll-canvas')).not.toBeInTheDocument();
  });

  describe('Scene 0 step bindings', () => {
    async function openScene0AtProgress(progress: number) {
      window.history.replaceState(null, '', '/scene/0');
      const { App, useAppStore } = await setUpApp(true);
      const utils = render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(progress);
      });
      return { ...utils, useAppStore };
    }
    const steps = tlsContent.scenes[0].steps;

    it('step 0.1: shows its caption and baseline labs; chips and badge are not revealed', async () => {
      const { useAppStore } = await openScene0AtProgress(0.1);
      expect(screen.getByText(steps[0].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ K: 4.2, Cr: 0.9 });
      expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('data-visible', 'false');
    });

    it('step 0.2: swaps the caption and reveals the seven chips', async () => {
      await openScene0AtProgress(0.5);
      expect(screen.getByText(steps[1].caption)).toBeInTheDocument();
      expect(screen.queryByText(steps[0].caption)).not.toBeInTheDocument();
      expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'false');
      expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('data-visible', 'false');
    });

    it('step 0.3: consolidates the chips into the HIGH RISK badge', async () => {
      await openScene0AtProgress(0.9);
      expect(screen.getByText(steps[2].caption)).toBeInTheDocument();
      expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('status')).toHaveTextContent('HIGH RISK');
    });

    it('keeps the lab strip timestamp from step 0.1 on later steps', async () => {
      await openScene0AtProgress(0.9);
      expect(screen.getAllByText('T+0h').length).toBeGreaterThan(0);
    });

    it('opens the Learn more panel for the active step and collapses it on the next step', async () => {
      const { useAppStore } = await openScene0AtProgress(0.1);
      await userEvent.click(screen.getByRole('button', { name: /learn more/i }));
      expect(screen.getByText(steps[0].learnMore!.heading)).toBeVisible();
      await act(async () => {
        useAppStore.getState().setSceneProgress(0.5);
      });
      expect(screen.getByRole('button', { name: /learn more/i })).toHaveAttribute('aria-expanded', 'false');
    });

    it('has no accessibility violations at any step', async () => {
      for (const p of [0.1, 0.5, 0.9]) {
        const { container, unmount } = await openScene0AtProgress(p);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
        vi.resetModules();
      }
    });
  });
});
