import { useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';

/**
 * Passes the loader's progress to the app's store, so the page's loading bar and the load timeout can use it without the
 * page itself having to load three.js to read it. Lives with the 3D engine, which owns the loader.
 */
export function AssetProgressBridge() {
  const { active, progress } = useProgress();
  const setAssetProgress = useAppStore((s) => s.setAssetProgress);
  useEffect(() => setAssetProgress(active, progress), [active, progress, setAssetProgress]);
  return null;
}
