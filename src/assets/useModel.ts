import { useGLTF } from '@react-three/drei';
import type { ModelManifest, ModelQuality, ModelUsage } from '../content/schema';
import { useAppStore } from '../store/useAppStore';
import { dracoDecoderPath, modelUrlsForScene, resolveModelUrl } from './resolveModel';

/**
 * Loads a model for the current quality tier. Suspends until loaded (wrap in <ModelBoundary>/<Suspense>); changing
 * the quality toggle changes the URL, which suspends again and fetches the other tier.
 */
export function useModel(manifest: ModelManifest, id: string, usage: ModelUsage = 'single') {
  const quality = useAppStore((s) => s.modelQuality);
  return useGLTF(resolveModelUrl(manifest, id, { quality, usage }), dracoDecoderPath());
}

const warmed = new Set<string>();

/**
 * Warms the cache for every model a scene uses, at the given quality. Safe to call repeatedly, and safe offline: the
 * file is probed first because useGLTF.preload turns a failed download into an unhandled promise rejection. A missing
 * file is not reported here; it surfaces where the model is actually used (the ModelBoundary).
 */
export function preloadScene(manifest: ModelManifest, sceneIndex: number, quality: ModelQuality): void {
  for (const url of modelUrlsForScene(manifest, sceneIndex, quality)) {
    if (warmed.has(url)) continue;
    warmed.add(url);
    fetch(url)
      .then((res) => {
        if (res.ok) useGLTF.preload(url, dracoDecoderPath());
        else warmed.delete(url);
      })
      .catch(() => warmed.delete(url));
  }
}
