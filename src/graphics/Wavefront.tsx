import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { WAVE_PLANE_Z } from '../lib/cytolysis';
import { AdditiveBlending, Mesh as ThreeMesh, NormalBlending, Plane, ShaderMaterial, Vector3, type Mesh } from 'three';

export interface WavefrontProps {
  /** Current world-space x of the leading edge. */
  getX: () => number;
  /** 0–1 overall strength. */
  getOpacity: () => number;
  /** Distance behind the leading edge over which the glow falls off. */
  width?: number;
  /** Half-width of the camera-facing quad. */
  extent?: number;
  /**
   * 'additive' glows on dark backgrounds. On a light background additive light vanishes, so 'normal' paints the bar
   * as an amber film in `color` instead.
   */
  blend?: 'additive' | 'normal';
  /** Bar colour as linear-ish 0–1 rgb. Defaults to the spec's amber-white. */
  color?: [number, number, number];
  /** Makes the bar grabbable: drag moves it, reporting the pointer's world x. */
  draggable?: boolean;
  onDragStart?: (worldX: number) => void;
  onDrag?: (worldX: number) => void;
  onDragEnd?: () => void;
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
// Added: a ring handle at mid-height that says "grab me", and u_active (hover/drag) to brighten the bar.
const fragmentShader = /* glsl */ `
  uniform float u_wave_x;
  uniform float u_wave_width;
  uniform float u_opacity;
  uniform float u_active;
  uniform float u_grabbable;
  uniform vec3 u_color;
  varying vec3 v_world_pos;
  void main() {
    float dist = v_world_pos.x - u_wave_x;
    float alpha = 0.0;
    if (dist > -u_wave_width && dist < 0.0) {
      alpha = pow(1.0 + dist / u_wave_width, 2.0);
    } else if (dist >= 0.0 && dist < 0.08) {
      alpha = 1.0 - dist / 0.08;
    }
    alpha *= 0.6 + 0.4 * u_active;

    // Handle: a thin ring on the leading edge, centred vertically.
    float r = length(vec2(dist - 0.02, v_world_pos.y));
    float ring = smoothstep(0.50, 0.44, r) * smoothstep(0.30, 0.36, r);
    float core = smoothstep(0.10, 0.04, r);
    float handle = (ring * 0.85 + core * 0.7) * u_grabbable * (0.55 + 0.45 * u_active);

    gl_FragColor = vec4(u_color, min(1.0, alpha + handle) * u_opacity);
  }
`;

/** Below this the bar is too faint to be a control. */
const GRAB_MIN_OPACITY = 0.3;
const noRaycast = () => {};

const plane = new Plane(new Vector3(0, 0, 1), -WAVE_PLANE_Z);
const hitPoint = new Vector3();

/**
 * A camera-facing quad lit only around a moving vertical line: reads as energy passing through the mass. The spec's
 * "thin plane" is realised as a wide quad whose fragments are lit by their distance to `u_wave_x`. When `draggable`,
 * an invisible strip over the bar takes pointer events (the scroll proxy forwards them to R3F), so the bar can be
 * grabbed and dragged through the mass.
 */
export function Wavefront({
  getX,
  getOpacity,
  width = 1.0,
  extent = 9,
  blend = 'additive',
  color = [1.0, 0.925, 0.8],
  draggable = false,
  onDragStart,
  onDrag,
  onDragEnd,
}: WavefrontProps) {
  const hit = useRef<Mesh>(null);
  const state = useRef({ hover: false, dragging: false, active: 0 });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          u_wave_x: { value: 0 },
          u_wave_width: { value: width },
          u_opacity: { value: 0 },
          u_active: { value: 0 },
          u_grabbable: { value: draggable ? 1 : 0 },
          u_color: { value: new Vector3(...color) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: blend === 'additive' ? AdditiveBlending : NormalBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, draggable, blend, color[0], color[1], color[2]],
  );

  // Never leave a stale cursor behind if the scene changes mid-hover.
  useEffect(() => () => void (document.body.style.cursor = ''), []);

  useFrame((_, delta) => {
    const x = getX();
    const opacity = getOpacity();
    material.uniforms.u_wave_x.value = x;
    material.uniforms.u_opacity.value = opacity;
    const s = state.current;
    const target = s.dragging ? 1 : s.hover ? 0.6 : 0;
    s.active += (target - s.active) * Math.min(1, delta * 12);
    material.uniforms.u_active.value = s.active;
    if (hit.current) {
      hit.current.position.x = x - 0.35;
      // Not grabbable while the bar is faded out. `visible = false` is not enough: three's raycaster, and so R3F's
      // pointer events, still hit invisible meshes. The strip would otherwise sit, unseen, at the end of the bar's
      // sweep in every scene (left edge before the wave, right edge after it) and a click on it would scrub the story.
      const grabbable = draggable && opacity > GRAB_MIN_OPACITY;
      hit.current.visible = grabbable;
      hit.current.raycast = grabbable ? ThreeMesh.prototype.raycast : noRaycast;
      if (!grabbable && (state.current.hover || state.current.dragging)) {
        state.current.hover = false;
        if (state.current.dragging) {
          state.current.dragging = false;
          onDragEnd?.();
        }
        setCursor('');
      }
    }
  });

  const worldX = (e: ThreeEvent<PointerEvent>): number | null => (e.ray.intersectPlane(plane, hitPoint) ? hitPoint.x : null);
  const setCursor = (value: string) => {
    document.body.style.cursor = value;
  };

  return (
    <>
      <mesh material={material} position={[0, 0, WAVE_PLANE_Z]} renderOrder={2}>
        <planeGeometry args={[extent * 2, 70]} />
      </mesh>
      {draggable && (
        <mesh
          ref={hit}
          position={[0, 0, WAVE_PLANE_Z]}
          onPointerOver={() => {
            state.current.hover = true;
            if (!state.current.dragging) setCursor('grab');
          }}
          onPointerOut={() => {
            state.current.hover = false;
            if (!state.current.dragging) setCursor('');
          }}
          onPointerDown={(e) => {
            const x = worldX(e);
            if (x === null) return;
            e.stopPropagation();
            (e.target as Element).setPointerCapture?.(e.pointerId);
            state.current.dragging = true;
            setCursor('grabbing');
            onDragStart?.(x);
          }}
          onPointerMove={(e) => {
            if (!state.current.dragging) return;
            // A drag is a held button. If the button is up (a release that never reached us), the drag is over: hovering
            // must never keep moving the story.
            if (e.buttons === 0) {
              state.current.dragging = false;
              setCursor(state.current.hover ? 'grab' : '');
              onDragEnd?.();
              return;
            }
            const x = worldX(e);
            if (x !== null) onDrag?.(x);
          }}
          onPointerUp={(e) => {
            if (!state.current.dragging) return;
            (e.target as Element).releasePointerCapture?.(e.pointerId);
            state.current.dragging = false;
            setCursor(state.current.hover ? 'grab' : '');
            onDragEnd?.();
          }}
          onLostPointerCapture={() => {
            if (!state.current.dragging) return;
            state.current.dragging = false;
            setCursor('');
            onDragEnd?.();
          }}
        >
          {/* Covers the bright edge and its glow trail; invisible, but still hit by the raycaster. */}
          <planeGeometry args={[1.6, 70]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </>
  );
}
