import { useMemo, type RefObject } from 'react';
import type { Group, MeshStandardMaterial } from 'three';

/**
 * Fades a prop with the scenery: hides the group at zero and scales the materials' opacity otherwise. Returns a
 * function to call every frame. `minOpacity` raises the resting opacity (the kidney on the pale canvas).
 */
export function useFade(materials: MeshStandardMaterial[], group: RefObject<Group | null>, getPresence: () => number, minOpacity = 0) {
  const rest = useMemo(() => materials.map((m) => Math.max(m.opacity, minOpacity)), [materials, minOpacity]);
  return () => {
    const presence = getPresence();
    if (group.current) group.current.visible = presence > 0.01;
    materials.forEach((m, i) => {
      m.transparent = true;
      m.opacity = rest[i] * presence;
    });
  };
}
