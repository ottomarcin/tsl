/**
 * The scene scrolls inside a proxy element that sits under the interface (toggles, captions, legend, minimap). A wheel
 * turn over one of those lands on the interface, not the proxy, so scrolling stalls whenever the pointer rests on it.
 * This decides whether such a wheel event should be handed on to the experience, and by how much.
 */
const LINE_HEIGHT = 16;

function scrollsVertically(el: Element): boolean {
  const { overflowY } = getComputedStyle(el);
  return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
}

/** Pixels to scroll the experience by, or null when the event should be left alone. */
export function forwardedWheelDelta(event: { target: EventTarget | null; deltaY: number; deltaMode: number; ctrlKey: boolean; defaultPrevented?: boolean }): number | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  // Pinch-zoom, and events something else already handled.
  if (event.ctrlKey || event.defaultPrevented) return null;
  // Over the scene itself: the proxy scrolls natively.
  if (target.closest('[data-scroll-proxy]')) return null;
  // Over something that scrolls on its own (an open Learn more panel, the mechanism toggle on a narrow screen).
  for (let el: Element | null = target; el; el = el.parentElement) {
    if (scrollsVertically(el)) return null;
  }
  if (event.deltaY === 0) return null;
  return event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaMode === 2 ? event.deltaY * 600 : event.deltaY;
}
