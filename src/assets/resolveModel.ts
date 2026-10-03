import type { ModelEntry, ModelManifest, ModelQuality, ModelUsage } from '../content/schema';

/**
 * Picks the file for a model.
 *
 *  - instanced, high:     `standard`   (hundreds of copies: never the HD mesh)
 *  - instanced, standard: `lod`, else `standard`
 *  - single,    high:     `high`, else `standard`
 *  - single,    standard: `standard`
 */
export function pickFile(entry: ModelEntry, quality: ModelQuality, usage: ModelUsage): string {
  if (usage === 'instanced') return quality === 'standard' ? (entry.lod ?? entry.standard) : entry.standard;
  return quality === 'high' ? (entry.high ?? entry.standard) : entry.standard;
}

export interface ResolveOptions {
  quality: ModelQuality;
  usage?: ModelUsage;
  /** Deployment base, e.g. '/' or '/tls/'. Defaults to Vite's BASE_URL. */
  baseUrl?: string;
}

const defaultBase = () => (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';

export function resolveModelUrl(manifest: ModelManifest, id: string, { quality, usage = 'single', baseUrl }: ResolveOptions): string {
  const entry = manifest.models[id];
  if (!entry) throw new Error(`Unknown model "${id}". Known: ${Object.keys(manifest.models).join(', ')}`);
  const base = (baseUrl ?? defaultBase()).replace(/\/?$/, '/');
  return `${base}${manifest.basePath}${pickFile(entry, quality, usage)}?v=${manifest.version}`;
}

/** The distinct files a scene needs at the given quality, for preloading. */
export function modelUrlsForScene(manifest: ModelManifest, sceneIndex: number, quality: ModelQuality, baseUrl?: string): string[] {
  const urls = new Set<string>();
  for (const [id, entry] of Object.entries(manifest.models)) {
    if (!entry.scenes.includes(sceneIndex)) continue;
    for (const usage of entry.usages) urls.add(resolveModelUrl(manifest, id, { quality, usage, baseUrl }));
  }
  return [...urls];
}

/** Decoder files are self-hosted (public/draco/) so the app never depends on a third-party CDN. */
export function dracoDecoderPath(baseUrl?: string): string {
  return `${(baseUrl ?? defaultBase()).replace(/\/?$/, '/')}draco/`;
}
