import type { ModelQuality } from '../content/schema';

export type AppRoute = { kind: 'landing' } | { kind: 'scene'; index: number } | { kind: 'end' };

export type Theme = 'dark' | 'light';

export type JumpSource = 'nav' | 'popstate' | 'url' | 'scroll';

export interface ScrollApi {
  /** `smooth` animates the scroll (nav clicks); otherwise the position jumps (deep links, back/forward). */
  scrollToPage: (page: number, smooth?: boolean, progress?: number) => void;
  /** Instantly scrolls to `progress` (0–1) within scene `page`. Used when something in the scene is dragged. */
  scrollToSceneProgress: (page: number, progress: number, smooth?: boolean) => void;
  /** Scrolls the experience by `deltaY` pixels, as if the wheel had turned over the scene itself. */
  scrollBy: (deltaY: number) => void;
}

export interface ToastState {
  id: number;
  message: string;
  /** One button, e.g. Retry or Refresh. */
  action?: { label: string; onClick: () => void };
  /** Closes itself after this many ms; stays until dismissed when absent. */
  autoDismissMs?: number;
}

export interface AppState {
  route: AppRoute;
  /** What caused the last route change. Scroll-driven changes replace history instead of pushing. */
  routeSource: JumpSource;
  /** 0–1 progress within the current scene. */
  sceneProgress: number;
  /** Position on the whole experience in scene units (0 = start of Scene 0, 2.5 = halfway through Scene 2). */
  globalProgress: number;
  theme: Theme;
  labValues: Record<string, number>;
  sideNavExpanded: boolean;
  /** Scene 5: the viewer's own intervention settings (step 5.6). Hydration is 0–1; the others are on/off. */
  interventionState: Record<string, number | boolean>;
  /** Scene 5: where the viewer has dragged the timeline, 0 (T+0h) to 1 (peak); null follows the story. */
  scrub: number | null;
  /** The chosen option of each scene's mode toggle, keyed by scene id. */
  modeSelection: Record<string, string>;
  /** Which model tier to load: 'high' (default) or 'standard' (lighter files). */
  modelQuality: ModelQuality;
  reducedMotion: boolean;
  accessibilityMode: boolean;
  /** The message at the bottom right, if any (one at a time). */
  toast: ToastState | null;
  /** Imperative plumbing to the scroll engine — not app state, never persisted. */
  scrollApi: ScrollApi | null;
}

export interface AppActions {
  /** `progress` seeds the new scene's 0–1 progress (scroll-driven jumps know it); otherwise it starts at 0. */
  /** Moves the story to the middle of a step of a scene: smoothly, or in one cut under reduced motion. */
  jumpToStep: (sceneIndex: number, stepIndex: number, stepCount: number) => void;
  jumpToScene: (index: number, opts?: { source?: JumpSource; progress?: number }) => void;
  goToLanding: () => void;
  goToEnd: () => void;
  /** Back to the landing screen with everything the visitor changed put back (interventions, scrubber, modes, labs). */
  restart: () => void;
  setSceneProgress: (progress: number) => void;
  setGlobalProgress: (g: number) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSideNavExpanded: (expanded: boolean) => void;
  toggleSideNav: () => void;
  setLabValue: (metricId: string, value: number) => void;
  setLabValues: (values: Record<string, number>) => void;
  setMode: (sceneId: string, optionId: string) => void;
  setInterventionState: (id: string, value: number | boolean) => void;
  resetInterventions: () => void;
  setScrub: (tau: number | null) => void;
  setModelQuality: (quality: ModelQuality) => void;
  toggleModelQuality: () => void;
  setReducedMotion: (reduced: boolean) => void;
  setAccessibilityMode: (enabled: boolean) => void;
  toggleAccessibilityMode: () => void;
  registerScrollApi: (api: ScrollApi | null) => void;
  /** Shows a toast; ignored while another one is up. Returns whether it was shown. */
  showToast: (toast: Omit<ToastState, 'id'>) => boolean;
  dismissToast: (id?: number) => void;
}

export type AppStore = AppState & AppActions;

export const SCENE_COUNT = 6;
/** Where in the last scene the end card sits: the end of Scene 5 behind it. */
export const END_PROGRESS = 0.97;
