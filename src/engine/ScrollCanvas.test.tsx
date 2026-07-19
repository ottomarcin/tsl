import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { DevPlaceholderMesh } from './DevPlaceholderMesh';

// 3D smoke test only — mount + scene-graph shape, not pixel output. Excluded
// from the coverage threshold via vite.config.ts's `src/engine/**` exclusion
// (tech arch §9). Testing the full ScrollCanvas (Canvas + ScrollControls) is
// intentionally left to manual verification in a real browser: drei's
// ScrollControls depends on real layout metrics (scrollHeight/clientHeight)
// that jsdom always reports as 0, so an automated test of that composition
// wouldn't exercise anything meaningful.
describe('DevPlaceholderMesh (3D smoke test)', () => {
  it('mounts without throwing and renders a mesh into the scene graph', async () => {
    const renderer = await ReactThreeTestRenderer.create(<DevPlaceholderMesh />);
    expect(renderer.scene.children.length).toBeGreaterThan(0);
    expect(renderer.scene.children[0].type).toBe('Mesh');
  });

  it('advances frames without throwing (rotation animation runs)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<DevPlaceholderMesh />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(5, 16);
    });
    expect(renderer.scene.children.length).toBeGreaterThan(0);
  });
});
