'use client';

import { useEffect, useRef, useState } from 'react';

const GLOWSTICKS_SRC = '/images/props/festival_glowsticks.png';

/** Dev: every character, burst on mount, ~4–6s repeats — flip off after tuning. */
export const GLOWSTICK_AMBIENT_TWEAK = false;

const MIN_INTERVAL_MS = GLOWSTICK_AMBIENT_TWEAK ? 4_000 : 20_000;
const MAX_INTERVAL_MS = GLOWSTICK_AMBIENT_TWEAK ? 6_000 : 30_000;
const BURST_DURATION_MS = 2_200;

type ThrownStick = {
  id: number;
  left: number;
  top: number;
  rot: number;
  tx: number;
  ty: number;
  delay: number;
  size: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeBurst(nextId: number): { sticks: ThrownStick[]; nextId: number } {
  const count = 10 + Math.floor(Math.random() * 5);
  const sticks: ThrownStick[] = [];
  let id = nextId;
  for (let i = 0; i < count; i++) {
    const dist = randomBetween(140, 280);
    const angle = randomBetween(-Math.PI * 0.85, Math.PI * 0.15);
    sticks.push({
      id: id++,
      left: 220 + randomBetween(-110, 110),
      top: 75 + randomBetween(-20, 40),
      rot: randomBetween(0, 360),
      tx: Math.cos(angle) * dist * 1.6,
      ty: Math.sin(angle) * dist - randomBetween(-10, 50),
      delay: randomBetween(0, 0.4),
      size: randomBetween(96, 132),
    });
  }
  return { sticks, nextId: id };
}

/** Periodic glowstick scatter for players who bought party glowsticks. */
export function GlowstickAmbient({ active }: { active: boolean }) {
  const [sticks, setSticks] = useState<ThrownStick[]>([]);
  const idRef = useRef(0);
  const clearBurstRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      setSticks([]);
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
      setSticks(burst.sticks);
      if (clearBurstRef.current) clearTimeout(clearBurstRef.current);
      clearBurstRef.current = setTimeout(() => {
        if (!cancelled) setSticks([]);
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

  if (!active || sticks.length === 0) return null;

  return (
    <div
      className="ch-glowstick-ambient"
      aria-hidden
      style={{ transform: 'scaleX(var(--ch-mirror, 1))' }}
    >
      {sticks.map(s => (
        <img
          key={s.id}
          src={GLOWSTICKS_SRC}
          alt=""
          draggable={false}
          className="ch-glowstick-thrown"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            ['--rot' as string]: `${s.rot}deg`,
            ['--tx' as string]: `${s.tx}px`,
            ['--ty' as string]: `${s.ty}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
