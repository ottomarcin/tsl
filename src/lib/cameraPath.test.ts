import { describe, expect, it } from 'vitest';
import { sampleCameraPath, type CameraKeyframe } from './cameraPath';

const path: CameraKeyframe[] = [
  { progress: 0, distance: 1, y: 0, fov: 35 },
  { progress: 0.6, distance: 1, y: 0, fov: 35 },
  { progress: 1, distance: 2, y: 0.5, fov: 40 },
];

describe('sampleCameraPath', () => {
  it('holds still across a flat segment', () => {
    expect(sampleCameraPath(path, 0.3)).toEqual({ distance: 1, y: 0, fov: 35 });
  });
  it('clamps outside the keyframe range', () => {
    expect(sampleCameraPath(path, -1)).toEqual({ distance: 1, y: 0, fov: 35 });
    expect(sampleCameraPath(path, 2)).toEqual({ distance: 2, y: 0.5, fov: 40 });
  });
  it('eases between keyframes: midpoint is the average, quarter point is below linear', () => {
    const mid = sampleCameraPath(path, 0.8);
    expect(mid.distance).toBeCloseTo(1.5, 6);
    expect(mid.fov).toBeCloseTo(37.5, 6);
    expect(sampleCameraPath(path, 0.7).distance).toBeLessThan(1.25);
  });
  it('is monotonic through the pull-back', () => {
    let prev = 0;
    for (let p = 0; p <= 1; p += 0.05) {
      const d = sampleCameraPath(path, p).distance;
      expect(d).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = d;
    }
  });
  it('treats duplicate progress as a step, taking the later keyframe', () => {
    const dup: CameraKeyframe[] = [
      { progress: 0, distance: 1, y: 0, fov: 30 },
      { progress: 0.5, distance: 2, y: 0, fov: 30 },
      { progress: 0.5, distance: 3, y: 0, fov: 30 },
    ];
    expect(sampleCameraPath(dup, 0.49).distance).toBeLessThan(2.01);
    expect(sampleCameraPath(dup, 0.5).distance).toBe(3);
  });
});
