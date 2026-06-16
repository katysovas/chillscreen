'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StickerTripCanvas } from './StickerTripCanvas';
import { buildTripShaderConfig, type TripShaderConfig } from './stickerTripShaders';

const MIN_INTERVAL_MS = 5_000;
const MAX_INTERVAL_MS = 10_000;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Full-screen WebGL noise trips while the mystery sticker is equipped. */
export function StickerTripOverlay({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [burst, setBurst] = useState<TripShaderConfig | null>(null);
  const tripIdRef = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) {
      setBurst(null);
      return;
    }

    let cancelled = false;
    let scheduleTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    const scheduleNext = (delayMs: number) => {
      if (cancelled) return;
      scheduleTimer = setTimeout(fireTrip, delayMs);
    };

    const fireTrip = () => {
      if (cancelled) return;
      tripIdRef.current += 1;
      const next = buildTripShaderConfig(tripIdRef.current);
      setBurst(next);
      clearTimer = setTimeout(() => {
        if (!cancelled) {
          setBurst(prev => (prev?.id === next.id ? null : prev));
        }
      }, next.durationMs);
      scheduleNext(next.durationMs + randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
    };

    fireTrip();

    return () => {
      cancelled = true;
      clearTimeout(scheduleTimer);
      clearTimeout(clearTimer);
      setBurst(null);
    };
  }, [active]);

  if (!mounted || !active) return null;

  return createPortal(
    <StickerTripCanvas burst={burst} />,
    document.body,
  );
}
