import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from './useAppStore';

const initialState = useAppStore.getState();

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
    window.localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  describe('jumpToScene', () => {
    it('updates route and resets sceneProgress', () => {
      useAppStore.getState().setSceneProgress(0.7);
      useAppStore.getState().jumpToScene(3);
      expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 3 });
      expect(useAppStore.getState().sceneProgress).toBe(0);
    });

    it('clamps out-of-range indices into the valid scene range', () => {
      useAppStore.getState().jumpToScene(99);
      expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 5 });
      useAppStore.getState().jumpToScene(-5);
      expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 0 });
    });

    it('calls scrollApi.scrollToPage for nav-originated jumps', () => {
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      useAppStore.getState().jumpToScene(2, { source: 'nav' });
      expect(scrollToPage).toHaveBeenCalledWith(2, true);
    });

    it('calls scrollApi.scrollToPage when no source is given (default: not scroll-originated)', () => {
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      useAppStore.getState().jumpToScene(4);
      expect(scrollToPage).toHaveBeenCalledWith(4, true);
    });

    it('does NOT call scrollApi.scrollToPage when the jump originates from scroll itself', () => {
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      useAppStore.getState().jumpToScene(2, { source: 'scroll' });
      expect(scrollToPage).not.toHaveBeenCalled();
      expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 2 });
    });

    it('does not throw when no scrollApi has been registered', () => {
      expect(() => useAppStore.getState().jumpToScene(1)).not.toThrow();
    });
  });

  describe('registerScrollApi', () => {
    it('self-corrects to the current scene route when registered after a jump already happened', () => {
      // Simulates the DOM tree's useRouteSync running before the R3F canvas
      // tree's ScrollProgressSync has mounted and registered its scroll API.
      useAppStore.getState().jumpToScene(4, { source: 'url' }); // no-op scroll call, scrollApi is null
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      expect(scrollToPage).toHaveBeenCalledWith(4);
    });

    it('does not call scrollToPage on registration when the current route is landing', () => {
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      expect(scrollToPage).not.toHaveBeenCalled();
    });
  });

  it('goToLanding and goToEnd set the corresponding route and reset progress', () => {
    useAppStore.getState().jumpToScene(3);
    useAppStore.getState().setSceneProgress(0.5);
    useAppStore.getState().goToEnd();
    expect(useAppStore.getState().route).toEqual({ kind: 'end' });
    expect(useAppStore.getState().sceneProgress).toBe(0);

    useAppStore.getState().goToLanding();
    expect(useAppStore.getState().route).toEqual({ kind: 'landing' });
  });

  describe('theme', () => {
    it('toggleTheme flips dark/light and persists to localStorage', () => {
      useAppStore.getState().setTheme('dark');
      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('light');
      expect(window.localStorage.getItem('theme')).toBe('light');

      useAppStore.getState().toggleTheme();
      expect(useAppStore.getState().theme).toBe('dark');
      expect(window.localStorage.getItem('theme')).toBe('dark');
    });

    it('setTheme also reflects the theme onto the data-theme attribute', () => {
      useAppStore.getState().setTheme('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  it('setSideNavExpanded / toggleSideNav update independently of other state', () => {
    useAppStore.getState().setSideNavExpanded(false);
    expect(useAppStore.getState().sideNavExpanded).toBe(false);
    useAppStore.getState().toggleSideNav();
    expect(useAppStore.getState().sideNavExpanded).toBe(true);
  });

  describe('lab values', () => {
    it('setLabValue updates a single metric without touching others', () => {
      useAppStore.getState().setLabValues({ K: 4.2, Ca: 9.4 });
      useAppStore.getState().setLabValue('K', 5.5);
      expect(useAppStore.getState().labValues).toEqual({ K: 5.5, Ca: 9.4 });
    });

    it('setLabValues merges rather than replaces', () => {
      useAppStore.getState().setLabValues({ K: 4.2 });
      useAppStore.getState().setLabValues({ Ca: 9.4 });
      expect(useAppStore.getState().labValues).toEqual({ K: 4.2, Ca: 9.4 });
    });
  });

  describe('intervention state', () => {
    it('setInterventionState updates a single key without touching others', () => {
      useAppStore.getState().setInterventionState('rasburicase', true);
      useAppStore.getState().setInterventionState('hydration', 0.5);
      expect(useAppStore.getState().interventionState).toEqual({ rasburicase: true, hydration: 0.5 });
    });

    it('resetInterventions clears all intervention state', () => {
      useAppStore.getState().setInterventionState('dialysis', true);
      useAppStore.getState().resetInterventions();
      expect(useAppStore.getState().interventionState).toEqual({});
    });
  });

  it('setReducedMotion and accessibility mode toggles update their own flags only', () => {
    useAppStore.getState().setReducedMotion(true);
    expect(useAppStore.getState().reducedMotion).toBe(true);

    useAppStore.getState().toggleAccessibilityMode();
    expect(useAppStore.getState().accessibilityMode).toBe(true);
    useAppStore.getState().setAccessibilityMode(false);
    expect(useAppStore.getState().accessibilityMode).toBe(false);
  });

  describe('scroll-driven navigation', () => {
    it('asks for an instant scroll (no animation) for deep links and back/forward', () => {
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      useAppStore.getState().jumpToScene(3, { source: 'popstate' });
      useAppStore.getState().jumpToScene(1, { source: 'url' });
      expect(scrollToPage).toHaveBeenNthCalledWith(1, 3, false);
      expect(scrollToPage).toHaveBeenNthCalledWith(2, 1, false);
    });

    it('does not animate the scroll for nav clicks under reduced motion', () => {
      const scrollToPage = vi.fn();
      useAppStore.getState().registerScrollApi({ scrollToPage, scrollToSceneProgress: vi.fn() });
      useAppStore.getState().setReducedMotion(true);
      useAppStore.getState().jumpToScene(2, { source: 'nav' });
      expect(scrollToPage).toHaveBeenCalledWith(2, false);
    });

    it('applies the route and its progress in one update, so no state has the new scene with the old progress', () => {
      const seen: [number, number][] = [];
      const unsub = useAppStore.subscribe((s) => seen.push([s.route.kind === 'scene' ? s.route.index : -1, s.sceneProgress]));
      useAppStore.getState().setSceneProgress(0.05);
      seen.length = 0;
      useAppStore.getState().jumpToScene(0, { source: 'scroll', progress: 0.97 });
      unsub();
      expect(seen).toEqual([[0, 0.97]]);
    });

    it('records what caused the route change', () => {
      useAppStore.getState().jumpToScene(2, { source: 'scroll', progress: 0.1 });
      expect(useAppStore.getState().routeSource).toBe('scroll');
      useAppStore.getState().goToEnd();
      expect(useAppStore.getState().routeSource).toBe('nav');
    });

    it('does not notify subscribers when progress has not really changed', () => {
      useAppStore.getState().setSceneProgress(0.5);
      let calls = 0;
      const unsub = useAppStore.subscribe(() => calls++);
      useAppStore.getState().setSceneProgress(0.50001);
      useAppStore.getState().setSceneProgress(0.5);
      expect(calls).toBe(0);
      useAppStore.getState().setSceneProgress(0.6);
      expect(calls).toBe(1);
      unsub();
    });
  });

  describe('model quality', () => {
    it('defaults to high', () => {
      expect(useAppStore.getState().modelQuality).toBe('high');
    });
    it('toggles between high and standard and persists the choice', () => {
      useAppStore.getState().toggleModelQuality();
      expect(useAppStore.getState().modelQuality).toBe('standard');
      expect(window.localStorage.getItem('modelQuality')).toBe('standard');
      useAppStore.getState().toggleModelQuality();
      expect(useAppStore.getState().modelQuality).toBe('high');
      expect(window.localStorage.getItem('modelQuality')).toBe('high');
    });
    it('sets an explicit tier', () => {
      useAppStore.getState().setModelQuality('standard');
      expect(useAppStore.getState().modelQuality).toBe('standard');
    });
  });
});
