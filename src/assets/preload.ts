import type { ModelManifest, ModelQuality } from '../content/schema';
import { dracoDecoderPath, modelUrlsForScene } from './resolveModel';

const warmed = new Set<string>();

/** drei (and three.js with it) is fetched once, the first time there is something to warm. */
let drei: Promise<typeof import('@react-three/drei')> | null = null;
const loadDrei = () => (drei ??= import('@react-three/drei'));

/** Lets a file be warmed again (a failed download was cleared from the loader's cache). */
export function forgetWarmed(url: string): void {
  warmed.delete(url);
}

/**
 * Warms the cache for every model a scene uses, at the given quality. Safe to call repeatedly, and safe offline: the
 * file is probed first because useGLTF.preload turns a failed download into an unhandled promise rejection. A missing
 * file is not reported here; it surfaces where the model is actually used (the ModelBoundary).
 *
 * Kept apart from `useModel` and loading three.js/drei only when a file is actually there to warm, so the landing screen
 * (which calls this) does not wait for the 3D engine to be parsed.
 */
export function preloadScene(manifest: ModelManifest, sceneIndex: number, quality: ModelQuality): void {
  for (const url of modelUrlsForScene(manifest, sceneIndex, quality)) {
    if (warmed.has(url)) continue;
    warmed.add(url);
    fetch(url)
      .then(async (res) => {
        if (!res.ok) return void warmed.delete(url);
        const { useGLTF } = await loadDrei();
        useGLTF.preload(url, dracoDecoderPath());
      })
      .catch(() => warmed.delete(url));
  }
}
