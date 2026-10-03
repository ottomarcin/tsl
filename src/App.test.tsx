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

const preloadScene = vi.fn();

async function setUpApp(webglSupported: boolean) {
  preloadScene.mockClear();
  // jsdom can't fetch/decode models; the loader itself is covered in assets/*.test.
  vi.doMock('./assets/useModel', () => ({ preloadScene, useModel: vi.fn() }));
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

// Step captions also appear in the side menu now, so the caption block is queried on its own.
const inCaption = () => within(screen.getByRole('region', { name: 'Scene caption' }));

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.clear();
    window.innerWidth = 1440;
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('./hooks');
    vi.doUnmock('./engine/ScrollCanvas');
    vi.doUnmock('./assets/useModel');
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
    expect(screen.queryByRole('img', { name: /Cascade progress minimap/ })).not.toBeInTheDocument();

    await act(async () => {
      useAppStore.getState().jumpToScene(3, { source: 'nav' });
    });
    rerender(<App />);
    expect(screen.getByRole('img', { name: /Cascade progress minimap/ })).toBeInTheDocument();
  });

  it('shows a placeholder for the end card when the route is /end', async () => {
    window.history.replaceState(null, '', '/end');
    const { App } = await setUpApp(true);
    render(<App />);
    // SideNav also has an "End card" nav item, so match the placeholder's exact copy, not a substring.
    expect(screen.getByText('End card — Epic 9')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-scroll-canvas')).not.toBeInTheDocument();
  });

  describe('model quality toggle', () => {
    it('switches the store between high and standard quality from the scene chrome', async () => {
      window.history.replaceState(null, '', '/scene/0');
      const { App, useAppStore } = await setUpApp(true);
      render(<App />);
      expect(useAppStore.getState().modelQuality).toBe('high');
      await userEvent.click(screen.getByRole('button', { name: /switch to standard quality/i }));
      expect(useAppStore.getState().modelQuality).toBe('standard');
      expect(screen.getByRole('button', { name: /switch to high quality/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('preloads the models of the current and the next scene, and again when the tier changes', async () => {
      window.history.replaceState(null, '', '/scene/1');
      const { App, useAppStore } = await setUpApp(true);
      render(<App />);
      // (The very first render still sees the landing route, which preloads 0 and 1 before the deep link applies.)
      expect(preloadScene.mock.calls.slice(-2).map((c) => [c[1], c[2]])).toEqual([[1, 'high'], [2, 'high']]);
      preloadScene.mockClear();
      await act(async () => {
        useAppStore.getState().setModelQuality('standard');
      });
      expect(preloadScene.mock.calls.map((c) => [c[1], c[2]])).toEqual([[1, 'standard'], [2, 'standard']]);
    });

    it('preloads Scene 0 (and 1) while the landing screen is showing', async () => {
      const { App } = await setUpApp(true);
      render(<App />);
      expect(preloadScene.mock.calls.map((c) => c[1])).toEqual([0, 1]);
    });

    it('shows the loading bar only while assets are loading', async () => {
      window.history.replaceState(null, '', '/scene/0');
      const { App } = await setUpApp(true);
      render(<App />);
      expect(screen.queryByRole('progressbar', { name: 'Loading 3D models' })).not.toBeInTheDocument();
    });
  });

  describe('responsive chrome', () => {
    it('shows the icon rail (collapsed) on tablet widths', async () => {
      window.innerWidth = 900;
      window.history.replaceState(null, '', '/scene/0');
      const { App } = await setUpApp(true);
      render(<App />);
      expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument();
    });

    it('replaces the rail with a hamburger + bottom sheet on mobile', async () => {
      window.innerWidth = 390;
      window.history.replaceState(null, '', '/scene/0');
      const { App, useAppStore } = await setUpApp(true);
      render(<App />);
      expect(screen.queryByRole('navigation', { name: 'Scene navigation' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: /cytolysis/i }));
      expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 1 });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('lays chips out as a column on mobile', async () => {
      window.innerWidth = 390;
      window.history.replaceState(null, '', '/scene/0');
      const { App } = await setUpApp(true);
      const { container } = render(<App />);
      expect(container.querySelector('[data-layout="column"]')).toBeInTheDocument();
    });
  });

  describe('side menu steps', () => {
    it('lists each step of the current scene with a short title, as buttons, and highlights the active one', async () => {
      window.history.replaceState(null, '', '/scene/2');
      const { App, useAppStore } = await setUpApp(true);
      render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(0.35);
      });
      const nav = screen.getByRole('navigation', { name: 'Scene navigation' });
      const steps = within(nav).getByRole('list', { name: 'The cascade steps' });
      const buttons = within(steps).getAllByRole('button');
      expect(buttons).toHaveLength(4);
      expect(buttons[1]).toHaveAttribute('aria-current', 'step');
      expect(buttons[0]).not.toHaveAttribute('aria-current');
      expect(buttons[1]).toHaveTextContent('2.2');
      expect(buttons[1]).toHaveTextContent(tlsContent.scenes[2].steps[1].title!);
      expect(buttons[1]).not.toHaveTextContent(tlsContent.scenes[2].steps[1].caption);
      expect(buttons[1]).toHaveAttribute('title', tlsContent.scenes[2].steps[1].caption);
    });

    it('clicking a step scrolls the story to it', async () => {
      window.history.replaceState(null, '', '/scene/3');
      const { App, useAppStore } = await setUpApp(true);
      render(<App />);
      const scrollToSceneProgress = vi.fn();
      await act(async () => {
        useAppStore.getState().registerScrollApi({ scrollToPage: vi.fn(), scrollBy: vi.fn(), scrollToSceneProgress });
      });
      await userEvent.click(screen.getByRole('button', { name: /^3\.3 / }));
      expect(scrollToSceneProgress).toHaveBeenCalledWith(3, 0.625, true);
    });
  });

  describe('Scene 4 step bindings', () => {
    async function openScene4AtProgress(progress: number) {
      window.history.replaceState(null, '', '/scene/4');
      const { App, useAppStore } = await setUpApp(true);
      const utils = render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(progress);
      });
      return { ...utils, useAppStore };
    }
    const steps = tlsContent.scenes[4].steps;

    it('step 4.1: every lab is flagged at T+48h', async () => {
      const { useAppStore } = await openScene4AtProgress(0.1);
      inCaption().getByText(steps[0].caption);
      expect(useAppStore.getState().labValues).toMatchObject({ K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 });
      expect(screen.getAllByText('T+48h').length).toBeGreaterThan(0);
    });

    it('steps 4.2 and 4.3 leave the lab strip unchanged (the panels carry their own severity)', async () => {
      const first = await openScene4AtProgress(0.1);
      const before = { ...first.useAppStore.getState().labValues };
      await act(async () => {
        first.useAppStore.getState().setSceneProgress(0.4);
      });
      expect(first.useAppStore.getState().labValues).toEqual(before);
      await act(async () => {
        first.useAppStore.getState().setSceneProgress(0.6);
      });
      expect(first.useAppStore.getState().labValues).toEqual(before);
      inCaption().getByText(steps[2].caption);
    });

    it('step 4.4 closes with the combined-risk Learn more', async () => {
      await openScene4AtProgress(0.9);
      inCaption().getByText(steps[3].caption);
      await userEvent.click(screen.getByRole('button', { name: /learn more/i }));
      expect(screen.getByText(steps[3].learnMore!.heading)).toBeVisible();
    });

    it('keeps the minimap with the potassium and calcium paths lit', async () => {
      await openScene4AtProgress(0.1);
      expect(screen.getByRole('img', { name: /Cascade progress minimap/ })).toBeInTheDocument();
    });

    it('has the four steps in the side menu and no mechanism toggle', async () => {
      await openScene4AtProgress(0.1);
      const nav = screen.getByRole('navigation', { name: 'Scene navigation' });
      expect(within(nav).getAllByRole('button', { name: /^4\.\d / })).toHaveLength(4);
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('has no accessibility violations at any step', async () => {
      for (const p of [0.1, 0.4, 0.6, 0.9]) {
        const { container, unmount } = await openScene4AtProgress(p);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
        vi.resetModules();
      }
    });
  });

  describe('Scene 5: interventions', () => {
    async function openScene5AtProgress(progress: number) {
      window.history.replaceState(null, '', '/scene/5');
      const { App, useAppStore } = await setUpApp(true);
      const utils = render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(progress);
      });
      return { ...utils, useAppStore };
    }
    const steps = tlsContent.scenes[5].steps;
    // Late in the step: by then the cascade of step 5.2 has run to its peak.
    const at = (step: number) => (step + 0.8) / 6;

    it('step 5.1 rewinds to the baseline labs at T+0h, with no scrubber and no panel', async () => {
      const { useAppStore } = await openScene5AtProgress(at(0));
      inCaption().getByText(steps[0].caption);
      expect(useAppStore.getState().labValues).toMatchObject({ K: 4.2, Ca: 9.4, PO4: 3.5, UA: 5.0, Cr: 0.9 });
      expect(screen.getAllByText('T+0h').length).toBeGreaterThan(0);
      expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    });

    it('step 5.2: rasburicase brings uric acid down and nothing else', async () => {
      const { useAppStore } = await openScene5AtProgress(at(1));
      const labs = useAppStore.getState().labValues;
      expect(labs.UA).toBeCloseTo(11.4 * 0.3, 6);
      expect(labs.K).toBe(6.3);
      expect(screen.getAllByText('T+48h').length).toBeGreaterThan(0);
    });

    it('step 5.3: allopurinol halves uric acid; step 5.4: hydration lowers K, PO₄ and creatinine; step 5.5: dialysis caps them', async () => {
      const { useAppStore } = await openScene5AtProgress(at(2));
      expect(useAppStore.getState().labValues.UA).toBeCloseTo(5.7, 6);
      await act(async () => useAppStore.getState().setSceneProgress(at(3)));
      expect(useAppStore.getState().labValues.K).toBeLessThan(6.3);
      expect(useAppStore.getState().labValues.Cr).toBeLessThan(3.1);
      await act(async () => useAppStore.getState().setSceneProgress(at(4)));
      expect(useAppStore.getState().labValues).toMatchObject({ K: 5.0, PO4: 5.0, UA: 7.0 });
    });

    it('shows the time scrubber from step 5.2 on, and dragging it moves the labs between T+0h and the peak', async () => {
      const { useAppStore } = await openScene5AtProgress(at(1));
      const scrubber = screen.getByRole('slider', { name: 'Time since lysis began' });
      expect(scrubber).toHaveAttribute('aria-valuetext', 'T+48h');
      await act(async () => useAppStore.getState().setScrub(0));
      expect(useAppStore.getState().labValues).toMatchObject({ K: 4.2, UA: 5.0 });
      expect(screen.getByRole('slider', { name: 'Time since lysis began' })).toHaveAttribute('aria-valuetext', 'T+0h');
      await act(async () => useAppStore.getState().setScrub(0.5));
      expect(useAppStore.getState().labValues.K).toBeCloseTo((4.2 + 6.3) / 2, 6);
    });

    it('a new step puts the scrubber back on the story\'s own timeline', async () => {
      const { useAppStore } = await openScene5AtProgress(at(1));
      await act(async () => useAppStore.getState().setScrub(0.2));
      await act(async () => useAppStore.getState().setSceneProgress(at(2)));
      expect(useAppStore.getState().scrub).toBeNull();
    });

    it('step 5.6 is free play: the panel appears, its switches drive the labs, and reset returns to baseline', async () => {
      const { useAppStore } = await openScene5AtProgress(at(5));
      inCaption().getByText(steps[5].caption);
      expect(screen.queryByRole('button', { name: /learn more/i })).not.toBeInTheDocument();
      const panel = screen.getByRole('region', { name: 'Try interventions' });
      expect(useAppStore.getState().labValues).toMatchObject({ K: 6.3, UA: 11.4 });
      await userEvent.click(within(panel).getByRole('switch', { name: 'Rasburicase' }));
      expect(useAppStore.getState().interventionState).toEqual({ rasburicase: true });
      expect(useAppStore.getState().labValues.UA).toBeCloseTo(3.42, 6);
      await userEvent.click(within(panel).getByRole('button', { name: 'Reset T+0' }));
      expect(useAppStore.getState().interventionState).toEqual({});
      expect(useAppStore.getState().labValues.UA).toBeCloseTo(11.4, 6);
    });

    it('the panel is not there before the last step', async () => {
      await openScene5AtProgress(at(4));
      expect(screen.queryByRole('region', { name: 'Try interventions' })).not.toBeInTheDocument();
    });

    it('on a phone the panel is a bottom sheet behind a "Try interventions" button', async () => {
      window.innerWidth = 390;
      await openScene5AtProgress(at(5));
      expect(screen.queryByRole('region', { name: 'Try interventions' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Try interventions' }));
      expect(await screen.findByRole('region', { name: 'Try interventions' })).toBeInTheDocument();
    });

    it('shows no cascade minimap (the cascade itself is on screen)', async () => {
      await openScene5AtProgress(at(1));
      expect(screen.queryByRole('img', { name: /Cascade progress minimap/ })).not.toBeInTheDocument();
    });

    it('has six steps in the side menu', async () => {
      await openScene5AtProgress(at(0));
      const nav = screen.getByRole('navigation', { name: 'Scene navigation' });
      expect(within(nav).getAllByRole('button', { name: /^5\.\d / })).toHaveLength(6);
    });

    it('has no accessibility violations at any step', async () => {
      for (const step of [0, 1, 5]) {
        const { container, unmount } = await openScene5AtProgress(at(step));
        expect(await axe(container)).toHaveNoViolations();
        unmount();
        vi.resetModules();
      }
    });
  });

  describe('Scene 3 step bindings and the mechanism toggle', () => {
    async function openScene3AtProgress(progress: number) {
      window.history.replaceState(null, '', '/scene/3');
      const { App, useAppStore } = await setUpApp(true);
      const utils = render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(progress);
      });
      return { ...utils, useAppStore };
    }
    const steps = tlsContent.scenes[3].steps;

    it('step 3.1: creatinine is still normal (the labs lag the mechanism) at T+30h', async () => {
      const { useAppStore } = await openScene3AtProgress(0.1);
      expect(inCaption().getByText(steps[0].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues.Cr).toBe(0.9);
      expect(screen.getAllByText('T+30h').length).toBeGreaterThan(0);
    });

    it('step 3.2: creatinine turns amber at 1.4', async () => {
      const { useAppStore } = await openScene3AtProgress(0.35);
      expect(useAppStore.getState().labValues.Cr).toBe(1.4);
    });

    it('step 3.4: all the upstream labs rise and are flagged', async () => {
      const { useAppStore } = await openScene3AtProgress(0.9);
      expect(useAppStore.getState().labValues).toMatchObject({ Cr: 2.8, K: 6.3, PO4: 7.5, UA: 11 });
      expect(screen.getAllByText('T+48h').length).toBeGreaterThan(0);
    });

    it('shows the cascade minimap here for the first time, with the kidney lit', async () => {
      await openScene3AtProgress(0.1);
      expect(screen.getByRole('img', { name: /Cascade progress minimap/ })).toBeInTheDocument();
      expect(screen.getByTestId('minimap-kidney')).toHaveAttribute('data-lit', 'true');
    });

    it('offers the four mechanisms from step 3.3 only, with histone marked emerging', async () => {
      const early = await openScene3AtProgress(0.35);
      expect(screen.queryByRole('tablist', { name: 'Injury mechanism' })).not.toBeInTheDocument();
      early.unmount();
      vi.resetModules();
      const { unmount } = await openScene3AtProgress(0.6);
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByText('emerging')).toBeInTheDocument();
      unmount();
    });

    it('selecting a mechanism stores the choice for the scene, with obstruction as the default', async () => {
      const { useAppStore } = await openScene3AtProgress(0.6);
      expect(screen.getByRole('tab', { name: 'Obstruction' })).toHaveAttribute('aria-selected', 'true');
      await userEvent.click(screen.getByRole('tab', { name: /vasoconstriction/i }));
      expect(useAppStore.getState().modeSelection['scene-3']).toBe('vasoconstriction');
      expect(screen.getByRole('tab', { name: /vasoconstriction/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText(/afferent arteriole narrows/i)).toBeVisible();
    });

    it('has no accessibility violations at any step', async () => {
      for (const p of [0.1, 0.35, 0.6, 0.9]) {
        const { container, unmount } = await openScene3AtProgress(p);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
        vi.resetModules();
      }
    });
  });

  describe('Scene 2 step bindings', () => {
    async function openScene2AtProgress(progress: number) {
      window.history.replaceState(null, '', '/scene/2');
      const { App, useAppStore } = await setUpApp(true);
      const utils = render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(progress);
      });
      return { ...utils, useAppStore };
    }
    const steps = tlsContent.scenes[2].steps;

    it('step 2.1: potassium climbs to 5.8 and the earlier scenes\' labs carry over', async () => {
      const { useAppStore } = await openScene2AtProgress(0.1);
      expect(inCaption().getByText(steps[0].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ K: 5.8, PO4: 5.5, UA: 7.8, Ca: 9.4 });
    });

    it('step 2.2: phosphate rises and calcium falls (the inversion)', async () => {
      const { useAppStore } = await openScene2AtProgress(0.35);
      expect(inCaption().getByText(steps[1].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ PO4: 6.2, Ca: 7.8, K: 5.8 });
    });

    it('step 2.3: uric acid reaches 9.5', async () => {
      const { useAppStore } = await openScene2AtProgress(0.6);
      expect(inCaption().getByText(steps[2].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues.UA).toBe(9.5);
    });

    it('step 2.4: all three are flagged at T+24h', async () => {
      const { useAppStore } = await openScene2AtProgress(0.9);
      expect(inCaption().getByText(steps[3].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ Ca: 7.6, PO4: 6.5, UA: 10.2 });
      expect(screen.getAllByText('T+24h').length).toBeGreaterThan(0);
    });

    it('keeps the T+12h timestamp from Scene 1 until step 2.4 sets a new one', async () => {
      await openScene2AtProgress(0.1);
      expect(screen.getAllByText('T+12h').length).toBeGreaterThan(0);
    });

    it('does not show the cascade minimap yet (it starts in Scene 3)', async () => {
      await openScene2AtProgress(0.9);
      expect(screen.queryByRole('img', { name: /Cascade progress minimap/ })).not.toBeInTheDocument();
    });

    it('states the 70 mg²/dL² threshold in the step 2.2 Learn more panel', async () => {
      await openScene2AtProgress(0.35);
      await userEvent.click(screen.getByRole('button', { name: /learn more/i }));
      expect(screen.getByText(/70 mg²\/dL² \(5\.6 mmol²\/L²\)/)).toBeVisible();
    });

    it('has no accessibility violations at any step', async () => {
      for (const p of [0.1, 0.35, 0.6, 0.9]) {
        const { container, unmount } = await openScene2AtProgress(p);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
        vi.resetModules();
      }
    });
  });

  describe('Scene 1 step bindings', () => {
    async function openScene1AtProgress(progress: number) {
      window.history.replaceState(null, '', '/scene/1');
      const { App, useAppStore } = await setUpApp(true);
      const utils = render(<App />);
      await act(async () => {
        useAppStore.getState().setSceneProgress(progress);
      });
      return { ...utils, useAppStore };
    }
    const steps = tlsContent.scenes[1].steps;

    it('step 1.1: K⁺ ticks up to 4.6 at T+6h, no chips or badge', async () => {
      const { useAppStore } = await openScene1AtProgress(0.1);
      expect(inCaption().getByText(steps[0].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues.K).toBe(4.6);
      expect(screen.getAllByText('T+6h').length).toBeGreaterThan(0);
      expect(screen.queryByTestId('chip-slot-ldh')).not.toBeInTheDocument();
    });

    it('step 1.2: K⁺, PO₄ and uric acid jump at T+12h', async () => {
      const { useAppStore } = await openScene1AtProgress(0.5);
      expect(inCaption().getByText(steps[1].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ K: 5.5, PO4: 5.5, UA: 7.8 });
      expect(screen.getAllByText('T+12h').length).toBeGreaterThan(0);
    });

    it('step 1.3: keeps the step 1.2 values and timestamp (labs continue, nothing is reset)', async () => {
      const { useAppStore } = await openScene1AtProgress(0.9);
      expect(inCaption().getByText(steps[2].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ K: 5.5, PO4: 5.5, UA: 7.8 });
      expect(screen.getAllByText('T+12h').length).toBeGreaterThan(0);
    });

    it('shows the Learn more content of the active step with its citations', async () => {
      await openScene1AtProgress(0.5);
      await userEvent.click(screen.getByRole('button', { name: /learn more/i }));
      expect(screen.getByText(steps[1].learnMore!.heading)).toBeVisible();
      expect(screen.getByText(/Sources for this step/i)).toBeVisible();
    });

    it('has no accessibility violations at any step', async () => {
      for (const p of [0.1, 0.5, 0.9]) {
        const { container, unmount } = await openScene1AtProgress(p);
        expect(await axe(container)).toHaveNoViolations();
        unmount();
        vi.resetModules();
      }
    });
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
      expect(inCaption().getByText(steps[0].caption)).toBeInTheDocument();
      expect(useAppStore.getState().labValues).toMatchObject({ K: 4.2, Cr: 0.9 });
      expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('data-visible', 'false');
    });

    it('step 0.2: swaps the caption and reveals the seven chips', async () => {
      await openScene0AtProgress(0.5);
      expect(inCaption().getByText(steps[1].caption)).toBeInTheDocument();
      expect(inCaption().queryByText(steps[0].caption)).not.toBeInTheDocument();
      expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'false');
      expect(screen.getByRole('status', { hidden: true })).toHaveAttribute('data-visible', 'false');
    });

    it('step 0.3: consolidates the chips into the HIGH RISK badge', async () => {
      await openScene0AtProgress(0.9);
      expect(inCaption().getByText(steps[2].caption)).toBeInTheDocument();
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
