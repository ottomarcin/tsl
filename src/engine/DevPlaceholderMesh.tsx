import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

/**
 * Throwaway scaffolding — proves the scroll → 3D pipeline renders something.
 * Stands in for scenes 2–5 until their content (Epics 5–8) exists; delete once Scene 5 exists.
 */
export function DevPlaceholderMesh() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.4;
    meshRef.current.rotation.y += delta * 0.6;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#5FBF8F" />
    </mesh>
  );
}
