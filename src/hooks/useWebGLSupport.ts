import { useState } from 'react';
import { detectWebGLSupport } from '../lib/webgl';

/** WebGL support doesn't change at runtime, so a lazy initializer is enough — no listener needed. */
export function useWebGLSupport(): boolean {
  const [supported] = useState(detectWebGLSupport);
  return supported;
}
