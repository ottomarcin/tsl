import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import styles from './ScenePointLabel.module.css';

export interface ScenePointLabelProps {
  /** World position the label is anchored to. */
  position: [number, number, number];
  text: string;
  /** CSS colour, usually a token such as 'var(--mol-purines)'. */
  color?: string;
  /** 0–1. */
  opacity?: number;
  /** Smaller and dimmer, for secondary markers such as the enzyme. */
  subtle?: boolean;
}

/** A text label pinned to a point in the 3D scene (drei Html). Never takes pointer events. */
export function ScenePointLabel({ position, text, color, opacity = 1, subtle = false }: ScenePointLabelProps) {
  // Inside ScrollControls, drei mounts Html in the scroll proxy by default, which scrolls the labels away with the page.
  // The canvas' own container stays put.
  const container = useThree((s) => s.gl.domElement.parentElement);
  const portal = useMemo(() => ({ current: container as HTMLElement }), [container]);
  return (
    <Html position={position} center zIndexRange={[5, 0]} portal={portal} style={{ pointerEvents: 'none' }}>
      <span className={[styles.label, subtle ? styles.subtle : ''].join(' ')} style={{ color, opacity }}>
        {text}
      </span>
    </Html>
  );
}
