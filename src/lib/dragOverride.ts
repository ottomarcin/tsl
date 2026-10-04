/**
 * Lets direct manipulation (dragging the wavefront) take over a progress value that normally comes from scrolling.
 *
 * While the pointer is down, the dragged value is returned exactly (no scroll damping between pointer and bar). After
 * release the override is held until the scroll-derived value has caught up with it, then handed back, so the bar never
 * jumps. Any scroll input cancels it at once. The hold is short: the scroll position is moved to match the dragged value, so
 * it normally catches up at once; if it never does (the visitor jumped elsewhere with the menu, which is not a wheel or
 * a touch), the override expires instead of pinning the bar at the dragged spot in every other scene.
 */
export const HOLD_MS = 400;

export class DragOverride {
  private value: number | null = null;
  private dragging = false;
  private endedAt = 0;

  constructor(
    private readonly tolerance = 0.01,
    private readonly now: () => number = () => performance.now(),
  ) {}

  get active(): boolean {
    return this.dragging;
  }

  start(value: number): void {
    this.dragging = true;
    this.value = value;
  }

  move(value: number): void {
    if (this.dragging) this.value = value;
  }

  end(): void {
    this.dragging = false;
    this.endedAt = this.now();
  }

  /** Forgets the dragged value altogether (the visitor has left the part of the story the bar belongs to). */
  reset(): void {
    this.dragging = false;
    this.value = null;
  }

  /** The visitor scrolled: the scroll position is authoritative again. */
  cancel(): void {
    if (!this.dragging) this.value = null;
  }

  /** The progress to use, given the current scroll-derived progress. */
  resolve(scrollProgress: number): number {
    if (this.value === null) return scrollProgress;
    if (!this.dragging && (Math.abs(scrollProgress - this.value) < this.tolerance || this.now() - this.endedAt > HOLD_MS)) {
      this.value = null;
      return scrollProgress;
    }
    return this.value;
  }
}
