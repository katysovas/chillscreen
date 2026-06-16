'use client';

import { useEffect, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import * as THREE from 'three';
import {
  SPACE_BG,
  SPACE_MID_TILE_H,
  SPACE_MID_TILE_W,
  SPACE_PARTICLE_COUNT,
  SPACE_RENDER_SCALE,
  SPACE_TARGET_FPS,
} from './constants';

const PI2 = Math.PI * 2;
const FRAME_MS = 1000 / SPACE_TARGET_FPS;

function particleBudget(): number {
  if (typeof window === 'undefined') return SPACE_PARTICLE_COUNT;
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return Math.floor(SPACE_PARTICLE_COUNT * 0.4);
  if (narrow) return Math.floor(SPACE_PARTICLE_COUNT * 0.6);
  return SPACE_PARTICLE_COUNT;
}

function pushShift(shift: Float32Array, i: number): void {
  const o = i * 4;
  shift[o] = Math.random() * Math.PI;
  shift[o + 1] = Math.random() * PI2;
  shift[o + 2] = (Math.random() * 0.9 + 0.1) * Math.PI * 0.1;
  shift[o + 3] = Math.random() * 0.7 + 0.25;
}

function fillParticleField(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const shift = new Float32Array(count * 4);

  let i = 0;
  const inner = Math.floor(count / 3);
  for (; i < inner; i++) {
    const theta = Math.random() * PI2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * 0.5 + 9.5;
    const si = i * 3;
    positions[si] = r * Math.sin(phi) * Math.cos(theta);
    positions[si + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[si + 2] = r * Math.cos(phi);
    sizes[i] = Math.random() * 1.5 + 0.5;
    pushShift(shift, i);
  }

  for (; i < count; i++) {
    const r = 10;
    const R = 40;
    const rand = Math.pow(Math.random(), 1.5);
    const radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
    const angle = Math.random() * PI2;
    const si = i * 3;
    positions[si] = Math.cos(angle) * radius;
    positions[si + 1] = (Math.random() - 0.5) * 2;
    positions[si + 2] = Math.sin(angle) * radius;
    sizes[i] = Math.random() * 1.5 + 0.5;
    pushShift(shift, i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('sizes', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('shift', new THREE.BufferAttribute(shift, 4));
  return geometry;
}

function buildPointsMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      attribute float sizes;
      attribute vec4 shift;
      varying vec3 vColor;
      void main() {
        float d = length(abs(position) / vec3(40., 10., 40.));
        d = clamp(d, 0., 1.);
        vColor = mix(vec3(0.89, 0.61, 0.0), vec3(0.39, 0.20, 1.0), d);
        float moveT = mod(shift.x + shift.z * uTime, 6.28318530718);
        float moveS = mod(shift.y + shift.z * uTime, 6.28318530718);
        vec3 drift = vec3(
          cos(moveS) * sin(moveT),
          cos(moveT),
          sin(moveS) * sin(moveT)
        ) * shift.w * 0.5;
        vec3 pos = position + drift;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        // Slightly larger sprite canvas — fragment shader keeps the core small and soft.
        gl_PointSize = 0.125 * sizes * (300.0 / max(-mvPosition.z, 1.0)) * 1.6;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float halo = smoothstep(0.5, 0.06, d);
        float core = smoothstep(0.14, 0.0, d);
        float alpha = halo * 0.7 + core * 0.55;
        vec3 col = vColor * (0.75 + core * 1.1);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

type Props = {
  /** When false, WebGL is torn down and only the flat backdrop is shown. */
  active?: boolean;
};

/** Lightweight nebula drift for the Space creator template. */
export function SpaceParticlesLayer({ active = true }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || SPACE_MID_TILE_W;
    const height = host.clientHeight || SPACE_MID_TILE_H;
    const renderW = Math.max(1, Math.floor(width * SPACE_RENDER_SCALE));
    const renderH = Math.max(1, Math.floor(height * SPACE_RENDER_SCALE));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x160016);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.set(0, 4, 21);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(renderW, renderH, false);
    const canvas = renderer.domElement;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.display = 'block';
    host.appendChild(canvas);

    const geometry = fillParticleField(particleBudget());
    const material = buildPointsMaterial();
    const points = new THREE.Points(geometry, material);
    points.rotation.order = 'ZYX';
    points.rotation.z = 0.2;
    scene.add(points);

    let raf = 0;
    let lastFrame = 0;
    let running = true;
    let visible = document.visibilityState === 'visible';
    let elapsed = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!running || !visible) return;
      if (now - lastFrame < FRAME_MS) return;
      const dt = lastFrame ? (now - lastFrame) / 1000 : FRAME_MS / 1000;
      lastFrame = now;

      elapsed += dt;
      material.uniforms.uTime!.value = elapsed * Math.PI * 0.35;
      points.rotation.y += 0.0022;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      if (visible) lastFrame = 0;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onResize = () => {
      const w = host.clientWidth || SPACE_MID_TILE_W;
      const h = host.clientHeight || SPACE_MID_TILE_H;
      const rw = Math.max(1, Math.floor(w * SPACE_RENDER_SCALE));
      const rh = Math.max(1, Math.floor(h * SPACE_RENDER_SCALE));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [active]);

  return (
    <foreignObject
      x={0}
      y={0}
      width={SPACE_MID_TILE_W}
      height={SPACE_MID_TILE_H}
      data-space-particles
    >
      <div
        {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
        ref={hostRef}
        style={{
          width: SPACE_MID_TILE_W,
          height: SPACE_MID_TILE_H,
          background: SPACE_BG,
          overflow: 'hidden',
        }}
      />
    </foreignObject>
  );
}
