import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parsePathname, routeToPathname } from '../lib/routing';
import type { AppRoute } from '../store/types';

function applyRoute(route: AppRoute, source: 'url' | 'popstate') {
  const { jumpToScene, goToLanding, goToEnd } = useAppStore.getState();
  if (route.kind === 'scene') jumpToScene(route.index, { source });
  else if (route.kind === 'landing') goToLanding();
  else goToEnd();
}

/**
 * Keeps the URL in sync with the store's route: typed/pasted URLs, side-nav
 * clicks, minimap clicks, and the browser back/forward button all converge on
 * the same jumpToScene/goToLanding/goToEnd actions (tech arch §7).
 */
export function useRouteSync(): void {
  const route = useAppStore((s) => s.route);
  const initialized = useRef(false);

  // Mount: parse the current URL, apply it, then normalize history with a
  // replace (not push) so the initial load doesn't add a spurious entry.
  useEffect(() => {
    const initial = parsePathname(window.location.pathname);
    applyRoute(initial, 'url');
    window.history.replaceState(null, '', routeToPathname(initial));
    initialized.current = true;

    const onPopState = () => {
      applyRoute(parsePathname(window.location.pathname), 'popstate');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Any subsequent store route change (nav click, minimap, scroll-boundary
  // crossing) pushes a new history entry if the URL doesn't already match.
  useEffect(() => {
    if (!initialized.current) return;
    const nextPath = routeToPathname(route);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
  }, [route]);
}
