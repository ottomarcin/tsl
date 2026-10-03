import { useEffect, useRef, useState } from 'react';
import { labAnnouncement, sceneAnnouncement } from '../lib/announce';
import type { DiseaseMetric, SceneDefinition } from '../content/schema';

/** How long the labs must hold still before they are read out (they tween, and scrubbing changes them often). */
const LAB_SETTLE_MS = 900;

/**
 * What the screen-reader live region says: the scene on entering it, and the labs that changed once they settle
 * ("Potassium now 6.3 mmol/L, critical."). Nothing is said for the first set of values, only for changes after.
 */
export function useAnnouncements(scene: SceneDefinition | undefined, metrics: DiseaseMetric[], labValues: Record<string, number>): string {
  const [message, setMessage] = useState('');
  const sceneId = scene?.id;
  useEffect(() => {
    if (scene) setMessage(sceneAnnouncement(scene.index, scene.title, scene.steps[0]?.caption));
    // Only a change of scene is announced, not every render of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  const spoken = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (Object.keys(labValues).length === 0) return;
    if (spoken.current === null) {
      spoken.current = labValues;
      return;
    }
    const timer = window.setTimeout(() => {
      const text = labAnnouncement(metrics, spoken.current ?? {}, labValues);
      spoken.current = labValues;
      if (text) setMessage(text);
    }, LAB_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [labValues, metrics]);

  return message;
}
