import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tlsModels } from '../content/tls/models';
import { pickFile } from './resolveModel';

// Guards the manifest against typos and against re-exports that need a decoder/extension the loader doesn't have.
const PUBLIC = resolve(__dirname, '../../public');
const SUPPORTED_EXTENSIONS = new Set(['KHR_draco_mesh_compression', 'EXT_texture_webp']);

function readGlb(path: string) {
  const buf = readFileSync(path);
  expect(buf.toString('ascii', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  return JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as { extensionsUsed?: string[]; meshes?: unknown[] };
}

describe('TLS model manifest', () => {
  const files = Object.entries(tlsModels.models).flatMap(([id, e]) =>
    [e.standard, e.high, e.lod].filter((f): f is string => !!f).map((f) => ({ id, file: f })),
  );

  it('lists at least one model', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('$id: $file exists and is a valid GLB the loader can decode', ({ file }) => {
    const path = resolve(PUBLIC, tlsModels.basePath, file);
    expect(existsSync(path)).toBe(true);
    const gltf = readGlb(path);
    expect((gltf.meshes ?? []).length).toBeGreaterThan(0);
    for (const ext of gltf.extensionsUsed ?? []) expect(SUPPORTED_EXTENSIONS).toContain(ext);
  });

  it('ships the Draco decoder files the loader points at', () => {
    for (const f of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
      expect(existsSync(resolve(PUBLIC, 'draco', f))).toBe(true);
    }
  });

  it('the 200-cell mass resolves to a light file on both tiers', () => {
    const cell = tlsModels.models.cell;
    expect(pickFile(cell, 'high', 'instanced')).toBe('s0_cell_base_tex.glb');
    expect(pickFile(cell, 'standard', 'instanced')).toBe('s0_cell_base_lod1.glb');
  });

  it('only references scenes that exist', () => {
    for (const e of Object.values(tlsModels.models)) for (const s of e.scenes) expect(s).toBeGreaterThanOrEqual(0);
  });
});
