'use client';

import { useEffect, useRef, useState } from 'react';

const CONFETTI_COLORS = [
  '#ff6b6b', // coral red
  '#ffd93d', // yellow
  '#6bcb77', // green
  '#4d96ff', // blue
  '#ff922b', // orange
  '#cc5de8', // purple
  '#f06595', // pink
  '#74c0fc', // sky blue
];

/** Dev: burst every ~4s and fire immediately — flip off before shipping. */
export const CONFETTI_AMBIENT_TWEAK = false;

const MIN_INTERVAL_MS = CONFETTI_AMBIENT_TWEAK ? 4_000 : 4_000;
const MAX_INTERVAL_MS = CONFETTI_AMBIENT_TWEAK ? 6_000 : 7_000;
const BURST_DURATION_MS = 4_000;

type ConfettiPiece = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  shape: 'rect' | 'circle';
  rot: number;
  spin: number;
  tx: number;
  up: number;
  down: number;
  delay: number;
  dur: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeBurst(nextId: number): { pieces: ConfettiPiece[]; nextId: number } {
  const confettiCount = 36;
  const sequinCount = 16;
  const pieces: ConfettiPiece[] = [];
  let id = nextId;

  for (let i = 0; i < confettiCount; i++) {
    const angle = randomBetween(-Math.PI * 0.85, Math.PI * 0.15);
    const dist = randomBetween(200, 420);
    pieces.push({
      id: id++,
      x: 220 + randomBetween(-80, 80),
      y: 75 + randomBetween(-10, 30),
      w: randomBetween(9, 15),
      h: randomBetween(14, 22),
      color: CONFETTI_COLORS[Math.floor(randomBetween(0, CONFETTI_COLORS.length))]!,
      shape: 'rect',
      rot: randomBetween(0, 360),
      spin: randomBetween(240, 640) * (Math.random() < 0.5 ? 1 : -1),
      tx: Math.cos(angle) * dist * 1.4,
      up: randomBetween(280, 520),
      down: randomBetween(120, 360),
      delay: randomBetween(0, 0.5),
      dur: randomBetween(2.0, 3.2),
    });
  }

  for (let i = 0; i < sequinCount; i++) {
    const radius = randomBetween(5, 9);
    pieces.push({
      id: id++,
      x: 220 + randomBetween(-55, 55),
      y: 80 + randomBetween(-10, 20),
      w: radius * 2,
      h: radius * 2,
      color: CONFETTI_COLORS[Math.floor(randomBetween(0, CONFETTI_COLORS.length))]!,
      shape: 'circle',
      rot: 0,
      spin: 0,
      tx: randomBetween(-200, 200),
      up: randomBetween(220, 440),
      down: randomBetween(100, 300),
      delay: randomBetween(0, 0.4),
      dur: randomBetween(2.0, 2.8),
    });
  }

  return { pieces, nextId: id };
}

/** Periodic confetti burst for players who bought the confetti cannon. */
export function ConfettiAmbient({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const idRef = useRef(0);
  const clearBurstRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    let cancelled = false;
    let scheduleTimer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      if (cancelled) return;
      scheduleTimer = setTimeout(fireBurst, randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
    };

    const fireBurst = () => {
      if (cancelled) return;
      const burst = makeBurst(idRef.current);
      idRef.current = burst.nextId;
      setPieces(burst.pieces);
      if (clearBurstRef.current) clearTimeout(clearBurstRef.current);
      clearBurstRef.current = setTimeout(() => {
        if (!cancelled) setPieces([]);
      }, BURST_DURATION_MS);
      scheduleNext();
    };

    fireBurst();

    return () => {
      cancelled = true;
      clearTimeout(scheduleTimer);
      if (clearBurstRef.current) clearTimeout(clearBurstRef.current);
    };
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div
      className="ch-confetti-ambient"
      aria-hidden
      style={{ transform: 'scaleX(var(--ch-mirror, 1))' }}
    >
      {pieces.map(p => (
        <div
          key={p.id}
          className="ch-confetti-piece"
          style={{
            left: p.x,
            top: p.y,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '1px',
            ['--rot' as string]: `${p.rot}deg`,
            ['--spin' as string]: `${p.spin}deg`,
            ['--tx' as string]: `${p.tx}px`,
            ['--up' as string]: `${p.up}px`,
            ['--down' as string]: `${p.down}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
