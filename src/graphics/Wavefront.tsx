import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, ShaderMaterial } from 'three';

export interface WavefrontProps {
  /** Current world-space x of the leading edge. */
  getX: () => number;
  /** 0–1 overall strength. */
  getOpacity: () => number;
  /** Distance behind the leading edge over which the glow falls off. */
  width?: number;
  /** Half-width of the camera-facing quad. */
  extent?: number;
}

const vertexShader = /* glsl */ `
  varying vec3 v_world_pos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    v_world_pos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Asset spec §3.2 `s1_wavefront.glsl`: bright amber-white leading line, quadratic falloff behind it, nothing ahead.
const fragmentShader = /* glsl */ `
  uniform float u_wave_x;
  uniform float u_wave_width;
  uniform float u_opacity;
  varying vec3 v_world_pos;
  void main() {
    float dist = v_world_pos.x - u_wave_x;
    float alpha = 0.0;
    if (dist > -u_wave_width && dist < 0.0) {
      alpha = pow(1.0 + dist / u_wave_width, 2.0);
    } else if (dist >= 0.0 && dist < 0.08) {
      alpha = 1.0 - dist / 0.08;
    }
    vec3 color = mix(vec3(1.0, 0.85, 0.6), vec3(1.0), 0.5);
    gl_FragColor = vec4(color, alpha * 0.6 * u_opacity);
  }
`;

/**
 * A camera-facing quad lit only around a moving vertical line: reads as energy passing through the mass. The spec's
 * "thin plane" is realised as a wide quad whose fragments are lit by their distance to `u_wave_x`.
 */
export function Wavefront({ getX, getOpacity, width = 1.0, extent = 9 }: WavefrontProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { u_wave_x: { value: 0 }, u_wave_width: { value: width }, u_opacity: { value: 0 } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [width],
  );

  useFrame(() => {
    material.uniforms.u_wave_x.value = getX();
    material.uniforms.u_opacity.value = getOpacity();
  });

  return (
    <mesh material={material} position={[0, 0, 0.5]} renderOrder={2}>
      {/* Tall enough to span the viewport on portrait screens at the pulled-back camera distance. */}
      <planeGeometry args={[extent * 2, 70]} />
    </mesh>
  );
}
