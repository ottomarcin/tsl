import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouteSync } from './useRouteSync';
import { useAppStore } from '../store/useAppStore';

const initialState = useAppStore.getState();

function setPath(path: string) {
  window.history.replaceState(null, '', path);
}

describe('useRouteSync', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
    setPath('/');
  });

  it('applies the initial URL to the store on mount', () => {
    setPath('/scene/3');
    renderHook(() => useRouteSync());
    expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 3 });
  });

  it('applies /end and / correctly on mount too', () => {
    setPath('/end');
    renderHook(() => useRouteSync());
    expect(useAppStore.getState().route).toEqual({ kind: 'end' });
  });

  it('normalizes an unrecognized initial path back to landing via replaceState, not pushState', () => {
    setPath('/nonsense');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    renderHook(() => useRouteSync());
    expect(useAppStore.getState().route).toEqual({ kind: 'landing' });
    expect(window.location.pathname).toBe('/');
    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('pushes a new history entry when the store route changes after mount (e.g. side nav click)', async () => {
    renderHook(() => useRouteSync());
    await act(async () => {
      await Promise.resolve(); // initialization is deferred one microtask
    });
    act(() => {
      useAppStore.getState().jumpToScene(2, { source: 'nav' });
    });
    expect(window.location.pathname).toBe('/scene/2');
  });

  it('replaces the history entry for scroll-driven scene changes and pushes for nav clicks', async () => {
    renderHook(() => useRouteSync());
    await act(async () => {
      await Promise.resolve();
    });
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    act(() => {
      useAppStore.getState().jumpToScene(1, { source: 'scroll', progress: 0.2 });
    });
    expect(replace).toHaveBeenCalledWith(null, '', '/scene/1');
    expect(push).not.toHaveBeenCalled();
    act(() => {
      useAppStore.getState().jumpToScene(4, { source: 'nav' });
    });
    expect(push).toHaveBeenCalledWith(null, '', '/scene/4');
    push.mockRestore();
    replace.mockRestore();
  });

  it('does not grow the back stack while scrolling across many scenes', async () => {
    renderHook(() => useRouteSync());
    await act(async () => {
      await Promise.resolve();
    });
    const before = window.history.length;
    for (const i of [1, 2, 3, 2, 1, 0]) {
      act(() => {
        useAppStore.getState().jumpToScene(i, { source: 'scroll', progress: 0.5 });
      });
    }
    expect(window.history.length).toBe(before);
  });

  it('does not push a duplicate history entry if the URL already matches the route', async () => {
    setPath('/scene/1');
    renderHook(() => useRouteSync());
    await act(async () => {
      await Promise.resolve();
    });
    const pushSpy = vi.spyOn(window.history, 'pushState');
    act(() => {
      useAppStore.getState().jumpToScene(1, { source: 'nav' });
    });
    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('updates the store when a popstate event fires (browser back/forward)', () => {
    renderHook(() => useRouteSync());
    act(() => {
      setPath('/scene/4');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 4 });
  });

  it('removes the popstate listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useRouteSync());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('does not let the initial render push the pre-apply route over a deep-linked URL (StrictMode double mount)', async () => {
    setPath('/scene/3');
    const { unmount } = renderHook(() => useRouteSync(), { wrapper: StrictMode });
    await act(async () => {
      await Promise.resolve();
    });
    expect(window.location.pathname).toBe('/scene/3');
    expect(useAppStore.getState().route).toEqual({ kind: 'scene', index: 3 });
    unmount();
  });
});
