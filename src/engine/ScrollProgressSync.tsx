import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import { SCENE_COUNT } from '../store/types';

/**
 * No-render component living inside <ScrollControls>, so it has useScroll()
 * context. Bidirectional sync between the scroll engine and the app store
 * (tech arch §6/§7): reads scroll offset every frame and writes it to the
 * store; registers an imperative scrollToPage callback the store's
 * jumpToScene action uses to move the scroll position back for
 * non-scroll-originated jumps (nav clicks, minimap, deep links, popstate).
 */
export function ScrollProgressSync() {
  const scroll = useScroll();
  const registerScrollApi = useAppStore((s) => s.registerScrollApi);
  const jumpToScene = useAppStore((s) => s.jumpToScene);
  const setSceneProgress = useAppStore((s) => s.setSceneProgress);
  const setGlobalProgress = useAppStore((s) => s.setGlobalProgress);
  const lastScene = useRef(-1);
  // R3F can run a frame before this component's effects flush; until the scroll API is registered (and the current
  // route applied to it) the scroll offset is meaningless and must not be written back to the route.
  const ready = useRef(false);
  // A jump requested before the scroll proxy has layout (deep links mount the canvas and ask for a page in the same
  // commit, while scrollHeight is still 0) is parked here and applied once the proxy is scrollable.
  const pendingPage = useRef<{ page: number; progress: number } | null>(null);
  // After applying a jump, ignore the offset until the (damped) scroll catches up with the target page, so the stale
  // value can't undo the jump. Capped so a failed scroll can never freeze the sync.
  const settling = useRef<{ page: number; frames: number } | null>(null);

  // Puts the damped scroll offset on the target at once. Without this, a cut (deep link, back/forward, a dragged
  // control) would make the whole 3D scene fly there from wherever the old offset was. (`scroll.scroll` is drei's
  // un-damped target; it exists at runtime but is missing from its types.)
  const cutTo = (offset: number) => {
    (scroll as unknown as { scroll: { current: number } }).scroll.current = offset;
    scroll.offset = offset;
  };

  useEffect(() => {
    // Horizontal drags (the Scene 1 wavefront) must reach the pointer handlers; only vertical pans scroll natively.
    scroll.el.style.touchAction = 'pan-y';
    scroll.el.setAttribute('data-scroll-proxy', '');
    registerScrollApi({
      scrollBy: (deltaY: number) => {
        scroll.el.scrollTop += deltaY;
      },
      scrollToSceneProgress: (page: number, progress: number, smooth = false) => {
        const el = scroll.el;
        const max = el.scrollHeight - el.clientHeight;
        if (max <= 0) return;
        const offset = (page + progress) / SCENE_COUNT;
        if (smooth) {
          el.scrollTo({ top: offset * max, behavior: 'smooth' });
          return;
        }
        el.scrollTop = offset * max;
        cutTo(offset);
      },
      scrollToPage: (page: number, smooth = false, progress = 0) => {
        const el = scroll.el;
        const max = el.scrollHeight - el.clientHeight;
        if (max > 0) {
          const offset = (page + progress) / SCENE_COUNT;
          if (smooth) el.scrollTo({ top: offset * max, behavior: 'smooth' });
          else {
            el.scrollTop = offset * max;
            cutTo(offset);
          }
          pendingPage.current = null;
          settling.current = { page, frames: 180 };
        } else {
          pendingPage.current = { page, progress };
        }
      },
    });
    ready.current = true;
    return () => {
      ready.current = false;
      registerScrollApi(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (!ready.current) return;
    if (pendingPage.current !== null) {
      const el = scroll.el;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      const { page, progress } = pendingPage.current;
      el.scrollTop = ((page + progress) / SCENE_COUNT) * max;
      cutTo((page + progress) / SCENE_COUNT);
      lastScene.current = page;
      pendingPage.current = null;
      settling.current = { page: lastScene.current, frames: 180 };
      return;
    }
    // The 3D scene follows the real (damped) scroll position every frame, even while a smooth nav click is flying
    // through the scenes in between: that flight is the point of a continuous experience.
    setGlobalProgress(scroll.offset * SCENE_COUNT);
    // Behind the end card the scene is only a backdrop: scrolling it must not turn the route back into a scene.
    if (useAppStore.getState().route.kind === 'end') return;
    if (settling.current) {
      const { page, frames } = settling.current;
      const reached = Math.min(SCENE_COUNT - 1, Math.floor(scroll.offset * SCENE_COUNT)) === page;
      if (reached || frames <= 1) settling.current = null;
      else {
        settling.current = { page, frames: frames - 1 };
        return;
      }
    }
    const globalOffset = scroll.offset;
    const sceneIndex = Math.min(SCENE_COUNT - 1, Math.floor(globalOffset * SCENE_COUNT));
    const local = scroll.range(sceneIndex / SCENE_COUNT, 1 / SCENE_COUNT);
    if (sceneIndex !== lastScene.current) {
      lastScene.current = sceneIndex;
      // Route and progress change together; writing progress first and then resetting it on the jump made the new
      // scene flash its start state for a frame, which is most visible scrolling up (new scene is at its end).
      jumpToScene(sceneIndex, { source: 'scroll', progress: local });
    } else {
      setSceneProgress(local);
    }
  });

  return null;
}
