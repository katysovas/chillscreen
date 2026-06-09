'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const COLORS = [
  '#ff4d4d', '#ff9900', '#ffe600', '#66ff33',
  '#00ffcc', '#3399ff', '#cc33ff', '#ff3399',
  '#ffffff', '#ffcccc', '#ccffcc', '#aaccff',
  '#ffaa44', '#44ffaa', '#aa44ff', '#ff44aa',
];

const GRAVITY = 0.055;
const FRICTION = 0.975;
const PARTICLE_COUNT = 80;

// Initial volley: fire N quick bursts, then settle into periodic rhythm
const VOLLEY_COUNT = 4;
const VOLLEY_STAGGER_MS = 350;
const MIN_INTERVAL_MS = 800;
const MAX_INTERVAL_MS = 1_600;

// Burst positions cycling (mirrors the SCSS position keyframes)
const POSITIONS: [number, number][] = [
  [0.40, 0.10],
  [0.70, 0.18],
  [0.25, 0.30],
  [0.60, 0.28],
  [0.80, 0.12],
  [0.35, 0.20],
  [0.55, 0.08],
  [0.20, 0.22],
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  trail: { x: number; y: number }[];
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createBurst(cx: number, cy: number): Particle[] {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  const accent = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + randomBetween(-0.15, 0.15);
    const speed = randomBetween(1.5, 7.5);
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() < 0.7 ? color : accent,
      alpha: 1,
      decay: randomBetween(0.010, 0.018),
      size: randomBetween(1.5, 3.5),
      trail: [],
    };
  });
}

function FireworksCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const posIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volleyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!active) {
      particlesRef.current = [];
      if (timerRef.current) clearTimeout(timerRef.current);
      volleyTimersRef.current.forEach(t => clearTimeout(t));
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d')!;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const fireBurst = () => {
      const [xPct, yPct] = POSITIONS[posIdxRef.current % POSITIONS.length]!;
      posIdxRef.current++;
      particlesRef.current.push(...createBurst(
        canvas.width * xPct,
        canvas.height * yPct,
      ));
    };

    const scheduleNext = () => {
      timerRef.current = setTimeout(() => {
        fireBurst();
        scheduleNext();
      }, randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
    };

    // Opening volley
    for (let i = 0; i < VOLLEY_COUNT; i++) {
      const t = setTimeout(fireBurst, i * VOLLEY_STAGGER_MS);
      volleyTimersRef.current.push(t);
    }
    setTimeout(scheduleNext, VOLLEY_COUNT * VOLLEY_STAGGER_MS + 200);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        // Trail
        for (let i = 0; i < p.trail.length; i++) {
          const t = p.trail[i]!;
          ctx.globalAlpha = Math.max(0, p.alpha * ((i + 1) / (p.trail.length + 2)) * 0.45);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Physics
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();
        p.vy += GRAVITY;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
      }

      ctx.globalAlpha = 1;
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.03);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timerRef.current) clearTimeout(timerRef.current);
      volleyTimersRef.current.forEach(t => clearTimeout(t));
      volleyTimersRef.current = [];
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
}

/** Full-screen fireworks bursts while the fireworks item is equipped. */
export function FireworksOverlay({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !active) return null;
  return createPortal(<FireworksCanvas active={active} />, document.body);
}
