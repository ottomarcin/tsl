/** Longest a jump between scenes may take (design spec §11: scene transitions complete within 800 ms). */
export const MAX_SCROLL_MS = 760;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** How long to take to cover `distance` pixels: quick for a step, never longer than the cap, whatever the distance. */
export function scrollDuration(distance: number): number {
  return Math.min(MAX_SCROLL_MS, 360 + 0.14 * Math.abs(distance));
}

/**
 * Scrolls an element to `top` over a fixed time, not at the browser's own pace (which grows with the distance and is
 * slower on a busy page). It runs on the clock, so a dropped frame costs smoothness, never time. It does not stop for
 * wheel, touch or key events: on a trackpad the tail of the last flick (momentum) keeps arriving at the scroll area for
 * a second or more after the pointer has moved to the menu, and treating it as "the viewer took over" made a click
 * on a step do nothing. A jump takes under 800 ms; a newer jump replaces it. Returns a function that stops it.
 */
export function smoothScrollTo(el: HTMLElement, top: number, onDone?: () => void): () => void {
  const from = el.scrollTop;
  const distance = top - from;
  if (distance === 0) {
    onDone?.();
    return () => {};
  }
  const duration = scrollDuration(distance);
  const start = performance.now();
  let frame = 0;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
  };
  const step = (now: number) => {
    if (stopped) return;
    const t = Math.min(1, (now - start) / duration);
    // The first frame's timestamp can be a hair before the moment the animation was started: never run backwards.
    el.scrollTop = from + distance * ease(Math.max(0, t));
    if (t < 1) frame = requestAnimationFrame(step);
    else {
      el.scrollTop = top; // exactly there, whatever the last easing step left
      stop();
      onDone?.();
    }
  };
  frame = requestAnimationFrame(step);
  return stop;
}
