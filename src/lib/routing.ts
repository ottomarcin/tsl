import type { AppRoute } from '../store/types';
import { SCENE_COUNT } from '../store/types';

/** Pure parse — no window/history access, independently testable. */
export function parsePathname(rawPathname: string): AppRoute {
  // /scene/2/ is the same page as /scene/2 (hosts that add a trailing slash).
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname;
  if (pathname === '/') return { kind: 'landing' };
  if (pathname === '/end') return { kind: 'end' };
  const match = /^\/scene\/([0-9]+)$/.exec(pathname);
  if (match) {
    const index = Number(match[1]);
    if (index >= 0 && index < SCENE_COUNT) return { kind: 'scene', index };
  }
  // Unrecognized path — fall back to landing rather than throwing.
  return { kind: 'landing' };
}

export function routeToPathname(route: AppRoute): string {
  if (route.kind === 'landing') return '/';
  if (route.kind === 'end') return '/end';
  return `/scene/${route.index}`;
}
