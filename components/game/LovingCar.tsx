'use client';

import { memo, useEffect, useRef } from 'react';
import { gameWorldOffRef, worldXToScreenPct } from '@/lib/gameWorldRef';
import { LVC_CSS } from './lovingCarStyles';

const DRIVE_MS = 12_000;
const CAR_SCALE = 0.35;
const CAR_WIDTH = 500 * CAR_SCALE;

let stylesInjected = false;
function injectStylesOnce() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-lvc', '');
  el.textContent = LVC_CSS;
  document.head.appendChild(el);
}

function LoveHeart({ className }: { className?: string }) {
  return (
    <div className={`lvc-love ${className ?? ''}`}>
      <span className="lvc-love-circle lvc-love-circle1" />
      <span className="lvc-love-circle lvc-love-circle2" />
      <span className="lvc-love-square" />
    </div>
  );
}

function Wheel({ side }: { side: 'back' | 'front' }) {
  return (
    <div className={`lvc-wheel-wrap lvc-wheel-wrap-${side}`}>
      <div className="lvc-wheel-shadow" />
      <div className="lvc-wheel">
        <div className="lvc-wheel-outer">
          <div className="lvc-wheel-cup">
            {[0, 1, 2, 3].map(i => <span key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlareLight() {
  return (
    <div className="lvc-light">
      <span className="lvc-light1" />
      <span className="lvc-light2" />
      <span className="lvc-light3" />
    </div>
  );
}

function LovingCarArt() {
  return (
    <div
      className="lvc-stage"
      style={{ ['--lvc-scale' as string]: String(CAR_SCALE) }}
    >
      <div className="lvc-love-front">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="lvc-love-wrap"><LoveHeart /></div>
        ))}
      </div>
      <div className="lvc-love-back">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="lvc-love-wrap"><LoveHeart /></div>
        ))}
      </div>

      <div className="lvc-vehicle-body">
        <div className="lvc-wrap-body">
          <div className="lvc-rooftop lvc-rooftop-back" />
          <div className="lvc-rooftop lvc-rooftop-front" />

          <div className="lvc-body-cover">
            <div className="lvc-top-roof" />
            <div className="lvc-indi lvc-indi-top" />
            <div className="lvc-indi lvc-indi-bottom" />

            <div className="lvc-back-window">
              <div className="lvc-window-base" />
              <div className="lvc-sun-shade" />
              <div className="lvc-curtain lvc-curtain-back">
                {Array.from({ length: 8 }, (_, i) => <span key={i} />)}
              </div>
              <div className="lvc-glass-wrap-back lvc-glass-pair">
                {[0, 1].map(i => (
                  <div key={i} className="lvc-glass">
                    <GlareLight />
                  </div>
                ))}
              </div>
              <div className="lvc-window-base lvc-window-base-bottom" />
            </div>

            <div className="lvc-front-window">
              <div className="lvc-window-base" />
              <div className="lvc-sun-shade" />
              <div className="lvc-curtain lvc-curtain-front">
                {Array.from({ length: 3 }, (_, i) => <span key={i} />)}
              </div>
              <div className="lvc-front-glass-wrap">
                <GlareLight />
              </div>
              <div className="lvc-air-hole">
                {Array.from({ length: 5 }, (_, i) => <span key={i} />)}
              </div>
            </div>
          </div>

          <div className="lvc-main-door">
            <div className="lvc-door-glass">
              <div className="lvc-light lvc-door-light">
                <span className="lvc-light1" />
                <span className="lvc-light2" />
              </div>
            </div>
            <div className="lvc-door-handle" />
          </div>

          <div className="lvc-side-guard">
            <div className="lvc-side-guard-shade" />
            <div className="lvc-bumper lvc-bumper-back" />
            <div className="lvc-bumper lvc-bumper-front" />
            <div className="lvc-front-indicator" />
          </div>
        </div>

        <Wheel side="back" />
        <Wheel side="front" />
      </div>
    </div>
  );
}

/**
 * World-anchored drive: truckX advances in ground space; screen position
 * subtracts live worldOff so parallax scroll cancels out — only drive speed shows.
 */
const LovingCarPass = memo(function LovingCarPass() {
  const runnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectStylesOnce();
    const el = runnerRef.current;
    if (!el) return;

    const vw = () => window.innerWidth;
    const off0 = gameWorldOffRef.current;
    const startX = off0 - vw() * 0.55;
    const endX = off0 + vw() * 1.05;
    const travel = endX - startX;
    const speed = travel / DRIVE_MS;

    let truckX = startX;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      truckX += speed * dt;

      const pct = worldXToScreenPct(truckX, gameWorldOffRef.current, vw());
      el.style.left = `${pct}%`;
      el.style.transform = 'translateX(-50%)';

      if (truckX < endX) {
        raf = requestAnimationFrame(tick);
      } else {
        el.style.visibility = 'hidden';
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={runnerRef} className="lvc-root lvc-runner">
      <LovingCarArt />
    </div>
  );
});

/** Loving car — world-anchored, drives left → right on load. */
export const LovingCarLayer = memo(function LovingCarLayer() {
  useEffect(() => { injectStylesOnce(); }, []);

  return (
    <div className="lvc-layer">
      <LovingCarPass />
    </div>
  );
});

export { LovingCarArt };
