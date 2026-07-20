import { useEffect, useRef, useState } from 'react';

/** 800ms tween on lab value change (design spec §6.1), instant under reduced motion. */
export function useTweenedValue(target: number, durationMs: number, reducedMotion: boolean): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    if (reducedMotion) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const from = displayRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    let rafId: number;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const value = from + (to - from) * t;
      displayRef.current = value;
      setDisplay(value);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs, reducedMotion]);

  return display;
}
