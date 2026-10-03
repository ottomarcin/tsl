/**
 * Lets direct manipulation (dragging the wavefront) take over a progress value that normally comes from scrolling.
 *
 * While the pointer is down, the dragged value is returned exactly (no scroll damping between pointer and bar). After
 * release the override is held until the scroll-derived value has caught up with it, then handed back, so the bar never
 * jumps. Any scroll input cancels it at once.
 */
export class DragOverride {
  private value: number | null = null;
  private dragging = false;

  constructor(private readonly tolerance = 0.01) {}

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
  }

  /** The visitor scrolled: the scroll position is authoritative again. */
  cancel(): void {
    if (!this.dragging) this.value = null;
  }

  /** The progress to use, given the current scroll-derived progress. */
  resolve(scrollProgress: number): number {
    if (this.value === null) return scrollProgress;
    if (!this.dragging && Math.abs(scrollProgress - this.value) < this.tolerance) {
      this.value = null;
      return scrollProgress;
    }
    return this.value;
  }
}
