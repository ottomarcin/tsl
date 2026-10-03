import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { InterventionEffects } from '../../lib/scene5';
import { effectsAt } from './scene5State';

const REST: InterventionEffects = { caphosShare: 1, uricShare: 1, purineLoss: 0, purineAction: null, flowSpeed: 1, dialysis: 0 };
/** Per second: how fast the picture follows a change of settings. */
const RATE = 3.5;

/**
 * The 3D scene's view of the interventions, eased so that flipping a switch or dragging the slider changes the picture
 * over about a second instead of cutting. Under reduced motion it follows at once. Returns a stable getter.
 */
export function useEasedEffects(getG: () => number, reducedMotion: boolean): () => InterventionEffects {
  const current = useRef<InterventionEffects>({ ...REST });
  const settled = useRef(false);
  useFrame((_, delta) => {
    const target = effectsAt(getG());
    const k = reducedMotion || !settled.current ? 1 : Math.min(1, delta * RATE);
    const c = current.current;
    c.caphosShare += (target.caphosShare - c.caphosShare) * k;
    c.uricShare += (target.uricShare - c.uricShare) * k;
    c.purineLoss += (target.purineLoss - c.purineLoss) * k;
    c.flowSpeed += (target.flowSpeed - c.flowSpeed) * k;
    c.dialysis += (target.dialysis - c.dialysis) * k;
    // The action's name is kept while the effect fades out, so a dissolve does not turn into a block on the way.
    if (target.purineAction) c.purineAction = target.purineAction;
    else if (c.purineLoss < 0.01) c.purineAction = null;
    settled.current = true;
  });
  return useCallback(() => current.current, []);
}
