import { create } from 'zustand';
import type { AppStore, JumpSource } from './types';
import { SCENE_COUNT } from './types';
import { persistTheme, readDomTheme } from '../lib/theme';

export const useAppStore = create<AppStore>((set, get) => ({
  route: { kind: 'landing' },
  sceneProgress: 0,
  theme: readDomTheme(),
  labValues: {},
  sideNavExpanded: true,
  interventionState: {},
  reducedMotion: false,
  accessibilityMode: false,
  scrollApi: null,

  jumpToScene(index: number, opts?: { source?: JumpSource }) {
    const clamped = Math.max(0, Math.min(SCENE_COUNT - 1, index));
    set({ route: { kind: 'scene', index: clamped }, sceneProgress: 0 });
    if (opts?.source !== 'scroll') {
      get().scrollApi?.scrollToPage(clamped);
    }
  },

  goToLanding() {
    set({ route: { kind: 'landing' }, sceneProgress: 0 });
  },

  goToEnd() {
    set({ route: { kind: 'end' }, sceneProgress: 0 });
  },

  setSceneProgress(progress: number) {
    set({ sceneProgress: progress });
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

  setInterventionState(id: string, value: number | boolean) {
    set((state) => ({ interventionState: { ...state.interventionState, [id]: value } }));
  },

  resetInterventions() {
    set({ interventionState: {} });
  },

  setReducedMotion(reduced: boolean) {
    set({ reducedMotion: reduced });
  },

  setAccessibilityMode(enabled: boolean) {
    set({ accessibilityMode: enabled });
  },

  toggleAccessibilityMode() {
    set((state) => ({ accessibilityMode: !state.accessibilityMode }));
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
    }
  },
}));
