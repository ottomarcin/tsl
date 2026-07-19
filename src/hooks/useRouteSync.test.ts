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

  it('pushes a new history entry when the store route changes after mount (e.g. side nav click)', () => {
    renderHook(() => useRouteSync());
    act(() => {
      useAppStore.getState().jumpToScene(2, { source: 'nav' });
    });
    expect(window.location.pathname).toBe('/scene/2');
  });

  it('does not push a duplicate history entry if the URL already matches the route', () => {
    setPath('/scene/1');
    renderHook(() => useRouteSync());
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
});
