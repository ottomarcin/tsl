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

/** Warms the cache for every model a scene uses, at the given quality. Safe to call repeatedly. */
export function preloadScene(manifest: ModelManifest, sceneIndex: number, quality: ModelQuality): void {
  for (const url of modelUrlsForScene(manifest, sceneIndex, quality)) useGLTF.preload(url, dracoDecoderPath());
}
