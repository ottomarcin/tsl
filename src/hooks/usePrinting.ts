import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * True while the page is being printed (or previewed). The print version is a different document (all six scenes as
 * text), so it is only built then; `flushSync` makes sure it is in the page before the browser lays it out.
 */
export function usePrinting(): boolean {
  const [printing, setPrinting] = useState(() => window.matchMedia?.('print').matches ?? false);
  useEffect(() => {
    const set = (value: boolean) => flushSync(() => setPrinting(value));
    const before = () => set(true);
    const after = () => set(false);
    const media = window.matchMedia?.('print');
    const onMedia = (e: MediaQueryListEvent) => set(e.matches);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    media?.addEventListener?.('change', onMedia);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      media?.removeEventListener?.('change', onMedia);
    };
  }, []);
  return printing;
}
