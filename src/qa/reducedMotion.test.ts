import { describe, expect, it } from 'vitest';
import { tlsContent } from '../content/tls';
import { REDUCED_MOTION_PROGRESS as CASCADE } from '../lib/cascade';
import { REDUCED_MOTION_PROGRESS as CYTOLYSIS } from '../lib/cytolysis';
import { REDUCED_MOTION_PROGRESS as RENAL } from '../lib/renal';
import { REDUCED_MOTION_PROGRESS as SCENE5 } from '../lib/scene5';
import { REDUCED_MOTION_PROGRESS as SYSTEMIC } from '../lib/systemic';
import { CLOUD_START, REWIND_START, SYSTEMIC_START, TUBULE_START, cameraPoseAt, type CameraContext } from '../lib/timeline';
import { snapToStep } from '../scenes/shared/useGetG';
import { stepIndexFromProgress } from '../lib/steps';

/**
 * Design QA, accessibility: under reduced motion each step is one still frame, and that frame must be the step itself,
 * never a moment from the flight between scenes (a half-faded tubule, a camera halfway into the kidney).
 */
const snapshots: Record<number, readonly number[]> = { 0: [0, 0, 0], 1: CYTOLYSIS, 2: CASCADE, 3: RENAL, 4: SYSTEMIC, 5: SCENE5 };
const ctx: CameraContext = { massDistance: 14, cascadeDistance: 12, cascadeTargetY: -5.4, tubuleDistance: 13, systemicDistance: 15, systemicTargetY: -10.6, keepFullFraming: false };

describe('reduced-motion snapshots', () => {
  it('has one snapshot per step in every scene', () => {
    for (const scene of tlsContent.scenes) expect(snapshots[scene.index], `scene ${scene.index}`).toHaveLength(scene.steps.length);
  });

  it('each snapshot falls in the progress band of its own step, so the step shown is the step the text describes', () => {
    // Scene 0's three steps share one still (the mass at rest; what changes between them, the chips, is not 3D). Scene 1's
    // events (the wave, the rupture, the cloud) are not evenly spread over its steps, so its stills follow the events.
    for (const scene of tlsContent.scenes.filter((s) => s.index > 1)) {
      snapshots[scene.index].forEach((p, step) => {
        expect(stepIndexFromProgress(p, scene.steps.length), `scene ${scene.index} step ${step + 1}`).toBe(step);
      });
    }
  });

  it('the stills of a scene never go backwards', () => {
    for (const scene of tlsContent.scenes) snapshots[scene.index].forEach((p, i, all) => i === 0 || expect(p).toBeGreaterThanOrEqual(all[i - 1]));
  });

  // Where the next scene's hand-over begins, as progress within each scene (the hand-overs happen at the END of a scene).
  const handOverStart: Record<number, number> = { 0: 0.7, 1: CLOUD_START - 1, 2: TUBULE_START - 2, 3: SYSTEMIC_START - 3, 4: REWIND_START - 4 };
  it('no snapshot is inside the hand-over to the next scene', () => {
    for (const [scene, start] of Object.entries(handOverStart)) {
      for (const p of snapshots[Number(scene)]) expect(p, `scene ${scene}`).toBeLessThan(start);
    }
  });

  it('the camera is at rest in every snapshot: the same framing as just before and just after it', () => {
    for (const scene of tlsContent.scenes) {
      for (const p of snapshots[scene.index]) {
        const g = scene.index + p;
        const here = cameraPoseAt(g, ctx);
        const there = cameraPoseAt(g + 0.005, ctx);
        expect(Math.abs(here.position[2] - there.position[2]), `${scene.index}+${p}`).toBeLessThan(0.2);
        expect(Math.abs(here.position[1] - there.position[1]), `${scene.index}+${p}`).toBeLessThan(0.2);
      }
    }
  });

  it('snapToStep maps any point of a step to that step\'s snapshot', () => {
    for (const scene of tlsContent.scenes) {
      const n = scene.steps.length;
      for (let step = 0; step < n; step++) {
        const g = scene.index + (step + 0.5) / n;
        expect(snapToStep(g), `scene ${scene.index} step ${step + 1}`).toBeCloseTo(scene.index + snapshots[scene.index][step], 9);
      }
    }
  });
});
