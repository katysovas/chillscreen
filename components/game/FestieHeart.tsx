'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  fill: number;
  glowColor: string;
  size?: number;
  hero?: boolean;
  animateRefillFrom?: number | null;
  className?: string;
  clipId?: string;
  /** Use span wrapper — safe inside inline/phrasing content (FAQ answers). */
  inline?: boolean;
};

const HEART_PATH =
  'M12 20.5s-6.2-4.35-8.5-7.4C2.1 10.8 2.6 7.4 5.2 5.8c2-.9 4.4-.3 5.8 1.5L12 8.2l1-1.5c1.4-1.8 3.8-2.4 5.8-1.5 2.6 1.6 3.1 5 1.7 7.3C18.2 16.15 12 20.5 12 20.5Z';

export function FestieHeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d={HEART_PATH}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Animated bioluminescent heart — fill 0–1, glow from festie preset. */
export function FestieHeart({
  fill,
  glowColor,
  size = 18,
  hero = false,
  animateRefillFrom = null,
  className,
  clipId = 'festie-heart-level-clip',
  inline = false,
}: Props) {
  const clamped = Math.max(0, Math.min(1, fill));
  const [displayFill, setDisplayFill] = useState(
    animateRefillFrom != null ? animateRefillFrom : clamped,
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (animateRefillFrom == null) {
      setDisplayFill(clamped);
      return;
    }
    if (!startedRef.current) {
      startedRef.current = true;
      setDisplayFill(animateRefillFrom);
      const t = window.setTimeout(() => setDisplayFill(clamped), 80);
      return () => window.clearTimeout(t);
    }
    setDisplayFill(clamped);
  }, [clamped, animateRefillFrom]);

  const dim = hero ? 72 : size;
  const pulseClass = hero ? 'festie-heart-pulse-hero' : 'festie-heart-pulse';
  const clipY = 24 - 24 * displayFill;

  const Wrapper = inline ? 'span' : 'div';

  return (
    <>
      <style>{`
        @keyframes festie-heart-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px ${glowColor}55); }
          50% { filter: drop-shadow(0 0 10px ${glowColor}aa); }
        }
        @keyframes festie-heart-pulse-hero {
          0%, 100% { filter: drop-shadow(0 0 12px ${glowColor}66); transform: scale(1); }
          50% { filter: drop-shadow(0 0 28px ${glowColor}cc); transform: scale(1.04); }
        }
        .festie-heart-pulse { animation: festie-heart-pulse 2.8s ease-in-out infinite; }
        .festie-heart-pulse-hero { animation: festie-heart-pulse-hero 2.4s ease-in-out infinite; }
      `}</style>
      <Wrapper
        className={className}
        style={{
          width: dim,
          height: dim,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: inline ? 'middle' : undefined,
        }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 24 24"
          aria-hidden
          className={pulseClass}
          style={{ display: 'block' }}
        >
          <path
            d={HEART_PATH}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <clipPath id={clipId}>
            <rect
              x={0}
              y={clipY}
              width={24}
              height={24 * displayFill}
              style={{ transition: 'y 1.4s ease, height 1.4s ease' }}
            />
          </clipPath>
          <path
            d={HEART_PATH}
            fill={glowColor}
            clipPath={`url(#${clipId})`}
            style={{ transition: 'opacity 0.3s ease' }}
          />
          <path
            d={HEART_PATH}
            fill="none"
            stroke={glowColor}
            strokeWidth={1.2}
            strokeLinejoin="round"
            opacity={0.85}
          />
        </svg>
      </Wrapper>
    </>
  );
}
