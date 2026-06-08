'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  createStickerTripProgram,
  getStickerTripUniforms,
  type StickerTripUniforms,
  type TripShaderConfig,
} from './stickerTripShaders';

const QUAD = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1,
]);

type Props = {
  /** Current burst params — null between trips. */
  burst: TripShaderConfig | null;
};

/** Persistent transparent WebGL overlay — stays mounted while the sticker is owned. */
export function StickerTripCanvas({ burst }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<StickerTripUniforms | null>(null);
  const burstRef = useRef<TripShaderConfig | null>(null);
  const burstStartRef = useRef(0);
  const timerRef = useRef(0);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(0);

  burstRef.current = burst;

  useEffect(() => {
    if (!burst) return;
    burstStartRef.current = performance.now();
    timerRef.current = 0;
    lastFrameRef.current = 0;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.mixBlendMode = burst.blendMode;
    }
    const gl = glRef.current;
    const uniforms = uniformsRef.current;
    if (gl && uniforms) {
      gl.uniform1f(uniforms.pattern, burst.pattern);
      gl.uniform1f(uniforms.seed, burst.seed);
      gl.uniform1f(uniforms.speed, burst.speed);
      gl.uniform1f(uniforms.scale, burst.scale);
      gl.uniform1f(uniforms.intensity, burst.intensity);
      gl.uniform1f(uniforms.phase, burst.phase);
    }
  }, [burst]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
    });
    if (!gl) {
      console.warn('[sticker-trip] WebGL unavailable');
      return;
    }
    glRef.current = gl;

    const program = createStickerTripProgram(gl);
    if (!program) return;

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = getStickerTripUniforms(gl, program);
    uniformsRef.current = uniforms;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    let cancelled = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      if (cancelled) return;
      rafRef.current = requestAnimationFrame(render);

      const active = burstRef.current;
      if (!active) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      const elapsed = now - burstStartRef.current;
      if (elapsed >= active.durationMs) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      const dt = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 0;
      lastFrameRef.current = now;
      timerRef.current += dt * active.speed;

      const progress = elapsed / active.durationMs;
      const envelope = Math.sin(progress * Math.PI);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.time, timerRef.current);
      gl.uniform1f(uniforms.envelope, envelope);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      glRef.current = null;
      uniformsRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ws-sticker-trip-canvas"
      aria-hidden
    />
  );
}
