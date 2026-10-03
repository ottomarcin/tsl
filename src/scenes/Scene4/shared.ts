import type { SystemicLayoutSpec } from './layout';

export interface Scene4Getters {
  /** Progress through the scene (0–1). */
  getProgress: () => number;
  /** 0–1: the whole scene fading in as the camera settles. */
  getPresence: () => number;
  reducedMotion: boolean;
  spec: SystemicLayoutSpec;
}
