'use client';

import { useEffect, useRef, useState } from 'react';
import './headlinerSky.css';

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  delayMs: number;
};

function buildStars(width: number, height: number): Star[] {
  const skyHeight = height / 2;
  const density = Math.max(8, Math.floor((width * skyHeight) / 6000));
  return Array.from({ length: density }, (_, id) => ({
    id,
    x: Math.floor(Math.random() * width),
    y: Math.floor(Math.random() * skyHeight),
    size: Math.floor(Math.random() * 3) + 1,
    delayMs: (Math.floor(Math.random() * 30) + 20) * 1000,
  }));
}

export function HeadlinerSkyBackdrop() {
  const skyRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [visibleStarIds, setVisibleStarIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const skyEl = skyRef.current;
    if (!skyEl) return;

    const seedStars = () => {
      const { width, height } = skyEl.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      setStars(buildStars(width, height));
      setVisibleStarIds(new Set());
    };

    seedStars();
    const observer = new ResizeObserver(seedStars);
    observer.observe(skyEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timers = stars.map(star => window.setTimeout(() => {
      setVisibleStarIds(prev => new Set(prev).add(star.id));
    }, star.delayMs));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [stars]);

  return (
    <div className="headliner-sky-backdrop" aria-hidden>
      <div className="headliner-sky__sky" ref={skyRef}>
        {stars.map(star => (
          <i
            key={star.id}
            className={[
              'headliner-sky__star',
              visibleStarIds.has(star.id) ? `headliner-sky__star--size${star.size}` : '',
            ].filter(Boolean).join(' ')}
            style={{ top: star.y, left: star.x }}
          />
        ))}
      </div>
      <div className="headliner-sky__ground" />
    </div>
  );
}
