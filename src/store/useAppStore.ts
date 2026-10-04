import { create } from 'zustand';
import type { AppStore, JumpSource } from './types';
import { END_PROGRESS, SCENE_COUNT } from './types';
import { persistTheme, readDomTheme } from '../lib/theme';
import { persistQuality, resolveInitialQuality } from '../lib/quality';
import { persistTextOnly, resolveInitialTextOnly } from '../lib/accessibility';

let toastId = 0;

export const useAppStore = create<AppStore>((set, get) => ({
  route: { kind: 'landing' },
  routeSource: 'url',
  sceneProgress: 0,
  globalProgress: 0,
  theme: readDomTheme(),
  labValues: {},
  sideNavExpanded: true,
  interventionState: {},
  scrub: null,
  modeSelection: {},
  modelQuality: resolveInitialQuality(window.location.search),
  reducedMotion: false,
  accessibilityMode: resolveInitialTextOnly(),
  scrollApi: null,
  assets: { active: false, progress: 0 },
  toast: null,

  jumpToScene(index: number, opts?: { source?: JumpSource; progress?: number }) {
    const clamped = Math.max(0, Math.min(SCENE_COUNT - 1, index));
    const source = opts?.source ?? 'nav';
    // One update carries the route and its progress, so no frame renders the new scene with the old scene's progress.
    const smooth = source === 'nav' && !get().reducedMotion;
    set({
      route: { kind: 'scene', index: clamped },
      routeSource: source,
      sceneProgress: opts?.progress ?? 0,
      // A cut (deep link, back/forward, reduced motion) lands the 3D scene on the target at once; a smooth nav click
      // leaves it to fly there with the scroll position.
      ...(source !== 'scroll' && !smooth ? { globalProgress: clamped + (opts?.progress ?? 0) } : {}),
    });
    if (source !== 'scroll') {
      get().scrollApi?.scrollToPage(clamped, smooth);
    }
  },

  jumpToStep(sceneIndex: number, stepIndex: number, stepCount: number) {
    // Middle of the step's band: far enough in that the step is unambiguously the active one.
    const progress = (stepIndex + 0.5) / Math.max(1, stepCount);
    get().scrollApi?.scrollToSceneProgress(sceneIndex, progress, !get().reducedMotion);
  },

  goToLanding() {
    set({ route: { kind: 'landing' }, routeSource: 'nav', sceneProgress: 0 });
  },

  goToEnd() {
    // The end card sits over the end of the last scene, which stays on screen behind it.
    const smooth = !get().reducedMotion && get().route.kind === 'scene';
    set({
      route: { kind: 'end' },
      routeSource: 'nav',
      sceneProgress: END_PROGRESS,
      ...(smooth ? {} : { globalProgress: SCENE_COUNT - 1 + END_PROGRESS }),
    });
    get().scrollApi?.scrollToSceneProgress(SCENE_COUNT - 1, END_PROGRESS, smooth);
  },

  restart() {
    set({
      route: { kind: 'landing' },
      routeSource: 'nav',
      sceneProgress: 0,
      globalProgress: 0,
      labValues: {},
      interventionState: {},
      scrub: null,
      modeSelection: {},
    });
  },

  setSceneProgress(progress: number) {
    // Called every frame while scrolling: skip no-op writes so subscribers aren't woken for nothing.
    if (Math.abs(progress - get().sceneProgress) < 1e-4) return;
    set({ sceneProgress: progress });
  },

  setGlobalProgress(g: number) {
    if (Math.abs(g - get().globalProgress) < 1e-5) return;
    set({ globalProgress: g });
  },

  setTheme(theme) {
    persistTheme(theme);
    set({ theme });
  },

  toggleTheme() {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setSideNavExpanded(expanded: boolean) {
    set({ sideNavExpanded: expanded });
  },

  toggleSideNav() {
    set((state) => ({ sideNavExpanded: !state.sideNavExpanded }));
  },

  setLabValue(metricId: string, value: number) {
    set((state) => ({ labValues: { ...state.labValues, [metricId]: value } }));
  },

  setLabValues(values: Record<string, number>) {
    set((state) => ({ labValues: { ...state.labValues, ...values } }));
  },

  setMode(sceneId: string, optionId: string) {
    set((state) => ({ modeSelection: { ...state.modeSelection, [sceneId]: optionId } }));
  },

  setInterventionState(id: string, value: number | boolean) {
    set((state) => ({ interventionState: { ...state.interventionState, [id]: value } }));
  },

  resetInterventions() {
    set({ interventionState: {}, scrub: null });
  },

  setScrub(tau: number | null) {
    set({ scrub: tau === null ? null : Math.max(0, Math.min(1, tau)) });
  },

  setModelQuality(quality) {
    persistQuality(quality);
    set({ modelQuality: quality });
  },

  toggleModelQuality() {
    get().setModelQuality(get().modelQuality === 'high' ? 'standard' : 'high');
  },

  setReducedMotion(reduced: boolean) {
    set({ reducedMotion: reduced });
  },

  setAccessibilityMode(enabled: boolean) {
    persistTextOnly(enabled);
    set({ accessibilityMode: enabled });
  },

  toggleAccessibilityMode() {
    get().setAccessibilityMode(!get().accessibilityMode);
  },

  setAssetProgress(active, progress) {
    const current = get().assets;
    if (current.active === active && Math.round(current.progress) === Math.round(progress)) return;
    set({ assets: { active, progress } });
  },

  showToast(toast) {
    if (get().toast) return false;
    set({ toast: { ...toast, id: ++toastId } });
    return true;
  },

  dismissToast(id) {
    const current = get().toast;
    if (current && (id === undefined || current.id === id)) set({ toast: null });
  },

  registerScrollApi(api) {
    set({ scrollApi: api });
    // Self-correct on registration: the DOM tree (useRouteSync) and the R3F
    // canvas tree (ScrollProgressSync) mount independently, so whichever
    // registers first can't rely on the other having already run. Re-applying
    // the current route here means either mount order ends up correct.
    const route = get().route;
    if (api && route.kind === 'scene') {
      api.scrollToPage(route.index);
    } else if (api && route.kind === 'end') {
      api.scrollToPage(SCENE_COUNT - 1, false, END_PROGRESS);
    }
  },
}));
