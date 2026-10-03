import { CanvasTexture, LinearFilter } from 'three';

let cached: CanvasTexture | null = null;

/** Shared 256×256 radial-falloff sprite (asset spec §3.2). Null where no 2D canvas exists (tests). */
export function getSoftParticleTexture(): CanvasTexture | null {
  if (cached) return cached;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  cached = new CanvasTexture(canvas);
  cached.minFilter = LinearFilter;
  return cached;
}
