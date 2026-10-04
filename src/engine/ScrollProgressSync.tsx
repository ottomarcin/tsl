import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import { SCENE_COUNT } from '../store/types';
import { smoothScrollTo } from '../lib/smoothScroll';

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
  // The running scroll animation (a jump between scenes), if any.
  const stopAnimation = useRef<() => void>(() => {});
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
    // Where in the story the viewer is (0–1), kept so a resize can put the scroll back. A jump updates it at once: the
    // layout can change right after one (leaving the end card gives the scene back its full height), and the resize
    // handling would otherwise restore the position from before the jump.
    let fraction = 0;
    let height = scroll.el.clientHeight;
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
        fraction = offset;
        if (smooth) {
          stopAnimation.current();
          stopAnimation.current = smoothScrollTo(el, offset * max);
          return;
        }
        stopAnimation.current();
        el.scrollTop = offset * max;
        cutTo(offset);
      },
      scrollToPage: (page: number, smooth = false, progress = 0) => {
        const el = scroll.el;
        const max = el.scrollHeight - el.clientHeight;
        if (max > 0) {
          const offset = (page + progress) / SCENE_COUNT;
          fraction = offset;
          stopAnimation.current();
          if (smooth) stopAnimation.current = smoothScrollTo(el, offset * max);
          else {
            el.scrollTop = offset * max;
            cutTo(offset);
          }
          pendingPage.current = null;
          settling.current = { page, frames: 180 };
        } else {
          fraction = (page + progress) / SCENE_COUNT;
          pendingPage.current = { page, progress };
        }
      },
    });
    // Rotating the phone (or resizing the window) changes the proxy's height, and the browser keeps the scroll in pixels:
    // the story would jump. Remember where in the story the viewer is, and put the scroll back there after a resize.
    const el = scroll.el;
    const maxScroll = () => el.scrollHeight - el.clientHeight;
    const onScroll = () => {
      // Scrolls caused by the resize itself (clamping to the new height) come before the observer fires: ignore them.
      if (el.clientHeight !== height) return;
      const max = maxScroll();
      if (max > 0) fraction = el.scrollTop / max;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      if (el.clientHeight === height) return;
      height = el.clientHeight;
      const max = maxScroll();
      if (max <= 0) return;
      el.scrollTop = fraction * max;
      cutTo(fraction);
    });
    observer?.observe(el);
    ready.current = true;
    return () => {
      ready.current = false;
      el.removeEventListener('scroll', onScroll);
      observer?.disconnect();
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
