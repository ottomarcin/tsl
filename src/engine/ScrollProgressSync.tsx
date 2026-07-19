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
  const lastScene = useRef(-1);

  useEffect(() => {
    registerScrollApi({
      scrollToPage: (page: number) => {
        const el = scroll.el;
        const max = el.scrollHeight - el.clientHeight;
        el.scrollTop = max > 0 ? (page / SCENE_COUNT) * max : 0;
      },
    });
    return () => registerScrollApi(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const globalOffset = scroll.offset;
    const sceneIndex = Math.min(SCENE_COUNT - 1, Math.floor(globalOffset * SCENE_COUNT));
    const local = scroll.range(sceneIndex / SCENE_COUNT, 1 / SCENE_COUNT);
    setSceneProgress(local);
    if (sceneIndex !== lastScene.current) {
      lastScene.current = sceneIndex;
      jumpToScene(sceneIndex, { source: 'scroll' });
    }
  });

  return null;
}
