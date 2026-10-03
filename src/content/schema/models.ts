export type ModelQuality = 'high' | 'standard';

/** How a scene draws a model: once or twice up close ('single'), or hundreds of times ('instanced'). */
export type ModelUsage = 'single' | 'instanced';

export interface ModelEntry {
  /** Light version, relative to the manifest's `basePath`. Always present: it is the fallback for every tier. */
  standard: string;
  /** Higher-detail version for close-ups when the quality tier is 'high'. */
  high?: string;
  /** Lowest-detail version, used for instanced models on the 'standard' tier. */
  lod?: string;
  /** Scenes (route indices) that draw this model, so the next scene's models can be preloaded. */
  scenes: number[];
  /** The ways those scenes use it; preloading fetches only the files these usages resolve to. */
  usages: ModelUsage[];
}

/** Maps logical model ids to files. Disease-specific data: lives in the content package, never in loader code. */
export interface ModelManifest {
  /** Folder served from the site root, e.g. 'models/'. */
  basePath: string;
  /** Appended as ?v= so re-exported models are not served stale (files in public/ are not content-hashed). */
  version: string;
  models: Record<string, ModelEntry>;
}
