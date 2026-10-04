import { useGLTF } from '@react-three/drei';
import type { ModelManifest, ModelUsage } from '../content/schema';
import { useAppStore } from '../store/useAppStore';
import { forgetWarmed } from './preload';
import { dracoDecoderPath, resolveModelUrl } from './resolveModel';

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
    forgetWarmed(url);
  }
  failed.clear();
}

