import type { AppRoute } from '../store/types';
import { SCENE_COUNT } from '../store/types';

/** Where the app is served from, without a trailing slash: '' at the root, '/tsl' on GitHub Pages. */
export function basePath(): string {
  return (import.meta.env?.BASE_URL ?? '/').replace(/\/+$/, '');
}

/** Pure parse — no window/history access, independently testable. */
export function parsePathname(rawPathname: string, base = basePath()): AppRoute {
  // The app may live in a subfolder (GitHub Pages): the routes start after it.
  const withoutBase = base && (rawPathname === base || rawPathname.startsWith(`${base}/`)) ? rawPathname.slice(base.length) || '/' : rawPathname;
  // /scene/2/ is the same page as /scene/2 (hosts that add a trailing slash).
  const pathname = withoutBase.length > 1 ? withoutBase.replace(/\/+$/, '') : withoutBase;
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

export function routeToPathname(route: AppRoute, base = basePath()): string {
  if (route.kind === 'landing') return `${base}/`;
  if (route.kind === 'end') return `${base}/end`;
  return `${base}/scene/${route.index}`;
}
