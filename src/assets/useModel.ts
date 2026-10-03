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
  const url = resolveModelUrl(manifest, id, { quality, usage });
  try {
    return useGLTF(url, dracoDecoderPath());
  } catch (error) {
    // A thrown Error is a failed download (a thrown promise is just "still loading"): note it so a retry can clear it.
    if (error instanceof Error) failed.add(url);
    throw error;
  }
}

const failed = new Set<string>();

/** Forgets the failed downloads, so the next attempt asks the network again instead of rethrowing the cached failure. */
export function clearFailedModels(): void {
  for (const url of failed) {
    useGLTF.clear(url);
    warmed.delete(url);
  }
  failed.clear();
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
