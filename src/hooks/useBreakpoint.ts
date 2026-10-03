import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** Design spec §4.1: mobile <768, tablet 768–1279, desktop ≥1280. */
export function breakpointForWidth(width: number): Breakpoint {
  if (width < 768) return 'mobile';
  if (width < 1280) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => breakpointForWidth(window.innerWidth));

  useEffect(() => {
    const onResize = () => setBp(breakpointForWidth(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}
