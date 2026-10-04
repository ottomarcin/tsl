/**
 * The 3D engine (three.js, react-three-fiber, drei: most of the bundle) is its own chunk, so the landing screen is
 * interactive without it. Kept in a module of its own so the app can start fetching it early and tests can replace it.
 */
export const loadScrollCanvas = () => import('./ScrollCanvas').then((m) => ({ default: m.ScrollCanvas }));
