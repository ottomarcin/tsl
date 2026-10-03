import type { ModelQuality } from '../content/schema';

export type AppRoute = { kind: 'landing' } | { kind: 'scene'; index: number } | { kind: 'end' };

export type Theme = 'dark' | 'light';

export type JumpSource = 'nav' | 'popstate' | 'url' | 'scroll';

export interface ScrollApi {
  /** `smooth` animates the scroll (nav clicks); otherwise the position jumps (deep links, back/forward). */
  scrollToPage: (page: number, smooth?: boolean) => void;
}

export interface AppState {
  route: AppRoute;
  /** What caused the last route change. Scroll-driven changes replace history instead of pushing. */
  routeSource: JumpSource;
  /** 0–1 progress within the current scene. */
  sceneProgress: number;
  theme: Theme;
  labValues: Record<string, number>;
  sideNavExpanded: boolean;
  interventionState: Record<string, number | boolean>;
  /** Which model tier to load: 'high' (default) or 'standard' (lighter files). */
  modelQuality: ModelQuality;
  reducedMotion: boolean;
  accessibilityMode: boolean;
  /** Imperative plumbing to the scroll engine — not app state, never persisted. */
  scrollApi: ScrollApi | null;
}

export interface AppActions {
  /** `progress` seeds the new scene's 0–1 progress (scroll-driven jumps know it); otherwise it starts at 0. */
  jumpToScene: (index: number, opts?: { source?: JumpSource; progress?: number }) => void;
  goToLanding: () => void;
  goToEnd: () => void;
  setSceneProgress: (progress: number) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSideNavExpanded: (expanded: boolean) => void;
  toggleSideNav: () => void;
  setLabValue: (metricId: string, value: number) => void;
  setLabValues: (values: Record<string, number>) => void;
  setInterventionState: (id: string, value: number | boolean) => void;
  resetInterventions: () => void;
  setModelQuality: (quality: ModelQuality) => void;
  toggleModelQuality: () => void;
  setReducedMotion: (reduced: boolean) => void;
  setAccessibilityMode: (enabled: boolean) => void;
  toggleAccessibilityMode: () => void;
  registerScrollApi: (api: ScrollApi | null) => void;
}

export type AppStore = AppState & AppActions;

export const SCENE_COUNT = 6;
