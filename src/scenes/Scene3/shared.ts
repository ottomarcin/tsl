import type { Mechanism } from '../../lib/renal';

export interface Scene3Getters {
  /** Progress through the nephron scene (0–1). */
  getProgress: () => number;
  /** 0–1 fade of the whole scene's materials as the camera arrives. */
  getPresence: () => number;
  /** The mechanism overlay in force (the viewer's choice from step 3.3 on). */
  getMechanism: () => Mechanism;
  reducedMotion: boolean;
}
