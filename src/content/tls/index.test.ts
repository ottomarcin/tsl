import { describe, expect, it } from 'vitest';
import { tlsContent } from './index';

describe('tlsContent', () => {
  it('has exactly 5 lab metrics', () => {
    expect(tlsContent.metrics).toHaveLength(5);
  });

  it('has a 3-branch cascade topology converging on the kidney', () => {
    expect(tlsContent.cascade.branches).toHaveLength(3);
    expect(tlsContent.cascade.convergencePointId).toBe('kidney');
    const branchIds = tlsContent.cascade.branches.map((b) => b.id);
    expect(new Set(branchIds)).toEqual(new Set(['K', 'PO4', 'purines']));
  });

  it('gives the purine branch its 5 waypoints in the documented order', () => {
    const purines = tlsContent.cascade.branches.find((b) => b.id === 'purines');
    expect(purines).toBeDefined();
    expect(purines?.waypoints.map((w) => w.label)).toEqual([
      'Hypoxanthine',
      'XO',
      'Xanthine',
      'XO',
      'Uric acid',
    ]);
    // waypoints must be in increasing order along the branch
    const ts = purines?.waypoints.map((w) => w.t) ?? [];
    expect(ts).toEqual([...ts].sort((a, b) => a - b));
  });

  it('has exactly 4 interventions with distinct ids', () => {
    expect(tlsContent.interventions).toHaveLength(4);
    expect(new Set(tlsContent.interventions.map((i) => i.id)).size).toBe(4);
  });

  it('has all 6 scenes present, indexed 0 through 5, with real (non-empty) step content', () => {
    expect(tlsContent.scenes).toHaveLength(6);
    tlsContent.scenes.forEach((scene, i) => {
      expect(scene.index).toBe(i);
      expect(scene.title.length).toBeGreaterThan(0);
      expect(scene.steps.length).toBeGreaterThan(0);
      for (const step of scene.steps) {
        expect(step.caption.length).toBeGreaterThan(0);
      }
    });
  });

  it("gives scene 0 exactly 3 steps and scene 5 exactly 6, per the design spec's scroll-step counts", () => {
    expect(tlsContent.scenes[0].steps).toHaveLength(3);
    expect(tlsContent.scenes[5].steps).toHaveLength(6);
  });

  it('omits Learn More only for scene 5 step 6 (the free-play step), per the design spec', () => {
    const stepsWithoutLearnMore = tlsContent.scenes.flatMap((scene) =>
      scene.steps.filter((step) => !step.learnMore).map((step) => step.id),
    );
    expect(stepsWithoutLearnMore).toEqual(['scene-5-step-6']);
  });

  it('gives every Learn More panel at least one citation', () => {
    for (const scene of tlsContent.scenes) {
      for (const step of scene.steps) {
        if (step.learnMore) {
          expect(step.learnMore.citations.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
