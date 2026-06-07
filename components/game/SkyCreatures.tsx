'use client';

import { forwardRef, memo } from 'react';
import type { SkyPeriod } from '@/lib/skyTimeOfDay';

// ─── Keyframes (injected via <style> in SFCity) ───────────────────────────────
export const SKY_CREATURES_KF = `
  @keyframes sky-ltr {
    0%        { transform: translate3d(-380px, 0, 0); }
    28%, 100% { transform: translate3d(calc(100vw + 380px), 0, 0); }
  }
  @keyframes sky-rtl {
    0%        { transform: translate3d(calc(100vw + 380px), 0, 0); }
    28%, 100% { transform: translate3d(-380px, 0, 0); }
  }
  @keyframes sky-ufo-ltr {
    0%      { transform: translate3d(-200px, 0, 0); }
    8%, 100% { transform: translate3d(calc(100vw + 200px), 0, 0); }
  }
  @keyframes ufo-bob {
    0%,100% { transform: translateY(0px) rotate(-2deg); }
    50%     { transform: translateY(-14px) rotate(2deg); }
  }
  @keyframes ufo-lt1 { 0%,100%{opacity:1}   45%{opacity:.08} }
  @keyframes ufo-lt2 { 0%,100%{opacity:.35} 65%{opacity:1}   }
  @keyframes ufo-lt3 { 0%,100%{opacity:.9}  20%{opacity:.05} }
  @keyframes ufo-glow {
    0%,100% { opacity:.3;  transform: scale(1);    }
    50%     { opacity:.75; transform: scale(1.28); }
  }
`;

// ─── Bird ────────────────────────────────────────────────────────────────────
function Bird({
  x = 0, y = 0, s = 1, flapDur = 0.7, ph = 0,
}: {
  x?: number; y?: number; s?: number; flapDur?: number; ph?: number;
}) {
  const stroke = 'rgba(8,16,44,0.78)';
  const sw = 2.2 * s;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="8 0 0;-32 0 0;8 0 0"
          dur={`${flapDur}s`}
          begin={`${ph}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          keyTimes="0; 0.5; 1"
        />
        <path
          d="M-13,2 Q-6,-5 0,0"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </g>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-8 0 0;32 0 0;-8 0 0"
          dur={`${flapDur}s`}
          begin={`${ph}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          keyTimes="0; 0.5; 1"
        />
        <path
          d="M13,2 Q6,-5 0,0"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

// ─── Flock layouts ────────────────────────────────────────────────────────────
type BirdCfg = { dx: number; dy: number; s: number; flapDur: number; ph: number };

const SMALL_FLOCK: BirdCfg[] = [
  { dx:  0, dy:  0, s: 1.00, flapDur: 0.72, ph: 0.00 },
  { dx: 30, dy: -7, s: 0.86, flapDur: 0.68, ph: 0.14 },
  { dx:-28, dy: -5, s: 0.90, flapDur: 0.75, ph: 0.07 },
  { dx: 58, dy:  2, s: 0.78, flapDur: 0.65, ph: 0.28 },
];

const LARGE_FLOCK: BirdCfg[] = [
  { dx:   0, dy:  0, s: 1.00, flapDur: 0.70, ph: 0.00 },
  { dx:  32, dy: -8, s: 0.88, flapDur: 0.67, ph: 0.12 },
  { dx: -30, dy: -6, s: 0.92, flapDur: 0.74, ph: 0.22 },
  { dx:  60, dy:  2, s: 0.80, flapDur: 0.64, ph: 0.38 },
  { dx: -56, dy:  5, s: 0.82, flapDur: 0.71, ph: 0.18 },
  { dx:  88, dy:-10, s: 0.74, flapDur: 0.78, ph: 0.45 },
  { dx: -82, dy: -3, s: 0.76, flapDur: 0.62, ph: 0.55 },
];

function BirdFlock({ birds, opacity }: { birds: BirdCfg[]; opacity: number }) {
  return (
    <svg
      width={220}
      height={60}
      viewBox="-110 -30 220 60"
      style={{ overflow: 'visible', display: 'block', opacity }}
    >
      {birds.map((b, i) => (
        <Bird key={i} x={b.dx} y={b.dy} s={b.s} flapDur={b.flapDur} ph={b.ph} />
      ))}
    </svg>
  );
}

// ─── Plane ────────────────────────────────────────────────────────────────────
function PlaneShape({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width={180}
      height={55}
      viewBox="-90 -28 180 55"
      style={{
        overflow: 'visible',
        display: 'block',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <line
        x1={-62} y1={1} x2={-265} y2={1}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth={3.5}
        strokeDasharray="26 18"
        strokeLinecap="round"
      />
      <line
        x1={-62} y1={-2} x2={-235} y2={-10}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={2}
        strokeDasharray="18 22"
        strokeLinecap="round"
      />
      <path
        d="M-56,0 Q-34,-5 0,-5 L46,-3 L56,0 L46,3 L0,5 Q-34,5 -56,0 Z"
        fill="#d4d8e6"
      />
      <path d="M46,-3 L62,0 L46,3 Z" fill="#b8c0d4" />
      <path d="M10,-5 L-20,-27 L-36,-25 L-6,-5 Z" fill="#bcc4d8" opacity={0.95} />
      <ellipse cx={-4} cy={-8} rx={10} ry={4} fill="#bcc4d8" />
      <ellipse cx={-4} cy={-8} rx={10} ry={2.2} fill="#aab4c8" />
      <path d="M-46,-5 L-58,-20 L-38,-5 Z" fill="#c0c8d8" />
      <path d="M-44,3 L-59,12 L-48,3 Z" fill="#c4ccd8" opacity={0.8} />
      {[-18, -6, 6, 18, 30].map((wx, i) => (
        <ellipse key={i} cx={wx} cy={-2} rx={4} ry={3} fill="rgba(168,214,255,0.65)" />
      ))}
    </svg>
  );
}

// ─── UFO ──────────────────────────────────────────────────────────────────────
function UFOShape() {
  return (
    <svg
      width={140}
      height={75}
      viewBox="-70 -38 140 75"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <ellipse
        cx={0} cy={20} rx={46} ry={12}
        fill="rgba(44,255,88,0.22)"
        style={{ animation: 'ufo-glow 1.9s ease-in-out infinite' }}
      />
      <ellipse cx={0} cy={3}  rx={52} ry={15} fill="#7a8898" />
      <ellipse cx={0} cy={0}  rx={52} ry={13} fill="#8f9caf" />
      <ellipse
        cx={0} cy={-3} rx={50} ry={9}
        fill="none"
        stroke="rgba(200,220,255,0.3)"
        strokeWidth={2.5}
      />
      <ellipse cx={0} cy={2} rx={52} ry={4} fill="rgba(120,140,180,0.28)" />
      <path
        d="M-27,-2 Q-22,-32 0,-34 Q22,-32 27,-2 Z"
        fill="rgba(130,205,255,0.55)"
      />
      <path
        d="M-16,-2 Q-11,-22 0,-24 Q11,-22 16,-2 Z"
        fill="rgba(180,235,255,0.26)"
      />
      <ellipse cx={0} cy={-2} rx={27} ry={5} fill="rgba(110,175,215,0.36)" />
      {([-34, -18, 0, 18, 34] as const).map((cx, i) => (
        <circle
          key={i}
          cx={cx}
          cy={9}
          r={4.5}
          fill="#44ff88"
          style={{
            animation: `ufo-lt${1 + (i % 3)} 0.88s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}

type SkyCreaturesLayerProps = {
  period?: SkyPeriod;
  worldOff: number;
};

// ─── Layer ────────────────────────────────────────────────────────────────────
export const SkyCreaturesLayer = memo(forwardRef<SVGSVGElement, SkyCreaturesLayerProps>(
function SkyCreaturesLayerInner({ period = 'day', worldOff: _worldOff }, _ref) {
  const fly = (dir: 'ltr' | 'rtl', period: number, delay: number) =>
    `${dir === 'ltr' ? 'sky-ltr' : 'sky-rtl'} ${period}s ${delay}s linear infinite`;

  const showBirdsAndPlanes = period !== 'night';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {showBirdsAndPlanes && (
          <>
            <div style={{ position: 'absolute', top: '9%', animation: fly('ltr', 62, -5) }}>
              <BirdFlock birds={LARGE_FLOCK} opacity={0.82} />
            </div>

            <div style={{ position: 'absolute', top: '17%', animation: fly('rtl', 75, -28) }}>
              <BirdFlock birds={SMALL_FLOCK} opacity={0.65} />
            </div>

            <div style={{ position: 'absolute', top: '13%', animation: fly('ltr', 55, -42) }}>
              <BirdFlock birds={SMALL_FLOCK} opacity={0.72} />
            </div>

            <div style={{ position: 'absolute', top: '23%', animation: fly('ltr', 80, -15) }}>
              <BirdFlock birds={LARGE_FLOCK} opacity={0.55} />
            </div>

            <div style={{ position: 'absolute', top: '8%', animation: fly('rtl', 68, -52) }}>
              <BirdFlock birds={SMALL_FLOCK} opacity={0.60} />
            </div>

            <div style={{ position: 'absolute', top: '6%', animation: fly('ltr', 95, -75) }}>
              <PlaneShape flip={false} />
            </div>

            <div style={{ position: 'absolute', top: '14%', animation: fly('rtl', 115, -58) }}>
              <PlaneShape flip={true} />
            </div>
          </>
        )}

        <div
          style={{
            position: 'absolute',
            top: '10%',
            animation: 'sky-ufo-ltr 160s -45s linear infinite',
          }}
        >
          <div style={{ animation: 'ufo-bob 3.2s ease-in-out infinite' }}>
            <UFOShape />
          </div>
        </div>
      </div>
    </div>
  );
}));
