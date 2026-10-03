import { describe, expect, it } from 'vitest';
import type { ModelManifest } from '../content/schema';
import { modelUrlsForScene, dracoDecoderPath, pickFile, resolveModelUrl } from './resolveModel';

const manifest: ModelManifest = {
  basePath: 'models/',
  version: '7',
  models: {
    cell: { standard: 'cell.glb', high: 'hd/cell.glb', lod: 'cell_lod1.glb', scenes: [0, 1], usages: ['instanced'] },
    heart: { standard: 'heart.glb', high: 'hd/heart.glb', scenes: [4], usages: ['single'] },
    badge: { standard: 'badge.glb', scenes: [5], usages: ['single', 'instanced'] },
  },
};

describe('pickFile', () => {
  const cell = manifest.models.cell;
  it('never gives an instanced model the HD mesh, even on the high tier', () => {
    expect(pickFile(cell, 'high', 'instanced')).toBe('cell.glb');
  });
  it('uses the lowest LOD for instanced models on the standard tier, falling back to standard', () => {
    expect(pickFile(cell, 'standard', 'instanced')).toBe('cell_lod1.glb');
    expect(pickFile(manifest.models.heart, 'standard', 'instanced')).toBe('heart.glb');
  });
  it('gives close-ups the HD mesh on the high tier and the light one on standard', () => {
    expect(pickFile(manifest.models.heart, 'high', 'single')).toBe('hd/heart.glb');
    expect(pickFile(manifest.models.heart, 'standard', 'single')).toBe('heart.glb');
  });
  it('falls back to standard when no higher tier exists', () => {
    expect(pickFile(manifest.models.badge, 'high', 'single')).toBe('badge.glb');
  });
});

describe('resolveModelUrl', () => {
  it('builds base + path + file + cache-busting version', () => {
    expect(resolveModelUrl(manifest, 'heart', { quality: 'high', baseUrl: '/' })).toBe('/models/hd/heart.glb?v=7');
  });
  it('defaults to a single close-up and respects a deployment sub-path', () => {
    expect(resolveModelUrl(manifest, 'heart', { quality: 'high', baseUrl: '/tls' })).toBe('/tls/models/hd/heart.glb?v=7');
    expect(resolveModelUrl(manifest, 'cell', { quality: 'high', usage: 'instanced', baseUrl: '/tls/' })).toBe('/tls/models/cell.glb?v=7');
  });
  it('throws a helpful error for unknown ids', () => {
    expect(() => resolveModelUrl(manifest, 'liver', { quality: 'high', baseUrl: '/' })).toThrow(/Unknown model "liver".*cell, heart, badge/);
  });
  it('changes the URL when the version changes (cache bust after re-export)', () => {
    const a = resolveModelUrl(manifest, 'cell', { quality: 'high', baseUrl: '/' });
    const b = resolveModelUrl({ ...manifest, version: '8' }, 'cell', { quality: 'high', baseUrl: '/' });
    expect(a).not.toBe(b);
  });
});

describe('modelUrlsForScene', () => {
  it('lists the distinct files for a scene at the chosen tier', () => {
    expect(modelUrlsForScene(manifest, 0, 'high', '/')).toEqual(['/models/cell.glb?v=7']);
    expect(modelUrlsForScene(manifest, 0, 'standard', '/')).toEqual(['/models/cell_lod1.glb?v=7']);
  });
  it('deduplicates when usages resolve to the same file', () => {
    expect(modelUrlsForScene(manifest, 5, 'high', '/')).toEqual(['/models/badge.glb?v=7']);
  });
  it('returns nothing for a scene with no models', () => {
    expect(modelUrlsForScene(manifest, 2, 'high', '/')).toEqual([]);
  });
});

describe('dracoDecoderPath', () => {
  it('is self-hosted under the deployment base, with a trailing slash', () => {
    expect(dracoDecoderPath('/')).toBe('/draco/');
    expect(dracoDecoderPath('/tls')).toBe('/tls/draco/');
  });
});
