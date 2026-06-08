import type { CSSProperties } from 'react';
import { cabanaThemeStyle, CABANA_LOGO_ASSET, type CabanaPlacement } from '@/lib/cabanas';

/** Canopy sign — rectangular VIP plaque with title + subtitle. */
const SIGN_CX = 250;
const SIGN_CY = 236;
const SIGN_PAD_X = 16;
const SIGN_INSET = 10;
const SIGN_W = 232;
const SIGN_H = 92;
const SIGN_X = SIGN_CX - SIGN_W / 2;
const SIGN_Y = SIGN_CY - SIGN_H / 2;
const SIGN_R = 8;

/** Rectangular flag on the pole — sized for the Reddit logo. */
const FLAG_POLE_X = 458;
const FLAG_RIGHT_X = 562;
const FLAG_TOP_Y = 49;
const FLAG_BOT_Y = 105;
const FLAG_W = FLAG_RIGHT_X - FLAG_POLE_X;
const FLAG_H = FLAG_BOT_Y - FLAG_TOP_Y;
const FLAG_LOGO_SIZE = 48;
const FLAG_LOGO_CX = (FLAG_POLE_X + FLAG_RIGHT_X) / 2 - 5;
const FLAG_LOGO_CY = 77;

type VipCabanaArtProps = {
  bannerLine1?: string;
  bannerLine2?: string;
  theme?: CabanaPlacement['theme'];
};

/** Inline cabana artwork — keeps SMIL flag flutter (external `<image>` would not). */
export function VipCabanaArt({
  bannerLine1 = 'VIP',
  bannerLine2 = 'r/electricdaisycarnival',
  theme,
}: VipCabanaArtProps) {
  return (
    <g style={cabanaThemeStyle(theme) as CSSProperties}>
      <ellipse cx="250" cy="476" rx="200" ry="22" fill="#000" opacity="0.12" />

      <g>
        <path d="M205 470 L295 470 L342 548 L158 548 Z" style={{ fill: 'var(--carpet, #c0202e)' }} />
        <path d="M250 470 L295 470 L342 548 L250 548 Z" style={{ fill: 'var(--carpet-shade, #9a141f)' }} opacity="0.35" />
        <path d="M232 470 L268 470 L286 548 L214 548 Z" style={{ fill: 'var(--carpet-hi, #d83948)' }} opacity="0.5" />
        <path d="M205 470 L158 548 M295 470 L342 548" style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 3 }} opacity="0.9" />
        <path d="M193 502 L307 502 M180 526 L320 526" style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 1.5 }} opacity="0.5" />
      </g>

      <rect x="92" y="232" width="316" height="240" rx="4" style={{ fill: 'var(--wall, #dfe2ec)' }} />

      <rect x="70" y="228" width="20" height="246" rx="4" style={{ fill: 'var(--post, #eef0f6)' }} />
      <rect x="82" y="228" width="8" height="246" style={{ fill: 'var(--post-shade, #cdd2df)' }} opacity="0.6" />
      <rect x="410" y="228" width="20" height="246" rx="4" style={{ fill: 'var(--post, #eef0f6)' }} />
      <rect x="422" y="228" width="8" height="246" style={{ fill: 'var(--post-shade, #cdd2df)' }} opacity="0.6" />

      <path d="M92 236 L198 236 Q196 295 176 326 Q150 352 130 360 Q152 384 152 432 Q152 458 168 468 Q130 460 96 468 L92 236 Z" style={{ fill: 'var(--curtain, #ffffff)' }} />
      <path d="M120 246 Q116 320 134 358 M150 244 Q150 320 150 360" style={{ fill: 'none', stroke: 'var(--curtain-fold, #dadeea)', strokeWidth: 3, strokeLinecap: 'round' }} opacity="0.7" />
      <rect x="118" y="350" width="26" height="14" rx="7" transform="rotate(-12 131 357)" style={{ fill: 'var(--accent, #d4af37)' }} />

      <path d="M408 236 L302 236 Q304 295 324 326 Q350 352 370 360 Q348 384 348 432 Q348 458 332 468 Q370 460 404 468 L408 236 Z" style={{ fill: 'var(--curtain, #ffffff)' }} />
      <path d="M380 246 Q384 320 366 358 M350 244 Q350 320 350 360" style={{ fill: 'none', stroke: 'var(--curtain-fold, #dadeea)', strokeWidth: 3, strokeLinecap: 'round' }} opacity="0.7" />
      <rect x="356" y="350" width="26" height="14" rx="7" transform="rotate(12 369 357)" style={{ fill: 'var(--accent, #d4af37)' }} />

      <path
        d="M50 210 Q250 135 450 210 L450 232 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 L50 210 Z"
        style={{ fill: 'var(--canopy, #ffffff)', stroke: 'var(--canopy-edge, #d2d6e2)', strokeWidth: 1.5 }}
      />
      <path
        d="M50 210 Q250 165 450 210 L450 232 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 L50 210 Z"
        style={{ fill: 'var(--canopy-shade, #e6e8f0)' }}
        opacity="0.55"
      />
      <path
        d="M450 232 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0 q-25 28 -50 0"
        style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 2.5 }}
        opacity="0.8"
      />

      <g>
        <rect
          x={SIGN_X + 2}
          y={SIGN_Y + 2}
          width={SIGN_W}
          height={SIGN_H}
          rx={SIGN_R}
          fill="#000"
          opacity="0.08"
        />
        <rect
          x={SIGN_X}
          y={SIGN_Y}
          width={SIGN_W}
          height={SIGN_H}
          rx={SIGN_R}
          style={{ fill: 'var(--sign, #ffffff)' }}
        />
        <rect
          x={SIGN_X}
          y={SIGN_Y}
          width={SIGN_W}
          height={SIGN_H}
          rx={SIGN_R}
          style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 3 }}
        />
        <rect
          x={SIGN_X + SIGN_INSET}
          y={SIGN_Y + SIGN_INSET}
          width={SIGN_W - SIGN_INSET * 2}
          height={SIGN_H - SIGN_INSET * 2}
          rx={5}
          style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 1 }}
          opacity="0.55"
        />
        <line
          x1={SIGN_X + SIGN_PAD_X}
          y1={SIGN_CY + 3}
          x2={SIGN_X + SIGN_W - SIGN_PAD_X}
          y2={SIGN_CY + 3}
          style={{ stroke: 'var(--accent, #d4af37)', strokeWidth: 1 }}
          opacity="0.35"
        />
        <text
          x={SIGN_CX}
          y={SIGN_CY - 11}
          textAnchor="middle"
          style={{
            fill: 'var(--banner-ink, #1c2030)',
            font: "800 26px system-ui, 'Segoe UI', Roboto, sans-serif",
            letterSpacing: '3px',
          }}
        >
          {bannerLine1}
        </text>
        <text
          x={SIGN_CX}
          y={SIGN_CY + 28}
          textAnchor="middle"
          style={{
            fill: 'var(--banner-ink, #1c2030)',
            font: "700 19px system-ui, 'Segoe UI', Roboto, sans-serif",
            letterSpacing: '0.2px',
          }}
        >
          {bannerLine2}
        </text>
      </g>

      <g>
        <rect x="162" y="506" width="6" height="42" rx="3" style={{ fill: 'var(--accent, #d4af37)' }} />
        <circle cx="165" cy="504" r="6" style={{ fill: 'var(--accent, #d4af37)' }} />
        <rect x="332" y="506" width="6" height="42" rx="3" style={{ fill: 'var(--accent, #d4af37)' }} />
        <circle cx="335" cy="504" r="6" style={{ fill: 'var(--accent, #d4af37)' }} />
        <path d="M165 504 Q250 540 335 504" style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 3 }} opacity="0.85" />
      </g>

      <ellipse cx="458" cy="471" rx="20" ry="5" fill="#000" opacity="0.12" />
      <line x1="458" y1="470" x2="458" y2="40" style={{ stroke: 'var(--post-shade, #cdd2df)', strokeWidth: 4, strokeLinecap: 'round' }} />
      <circle cx="458" cy="38" r="4.5" style={{ fill: 'var(--accent, #d4af37)' }} />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-1.6 458 54;1.6 458 54;-1.6 458 54"
          keyTimes="0;0.5;1"
          dur="3.2s"
          calcMode="spline"
          keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="skewX"
          additive="sum"
          values="-1.5;1.5;-1.5"
          keyTimes="0;0.5;1"
          dur="1.9s"
          calcMode="spline"
          keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
          repeatCount="indefinite"
        />
        <rect
          x={FLAG_POLE_X}
          y={FLAG_TOP_Y}
          width={FLAG_W}
          height={FLAG_H}
          rx={2}
          style={{ fill: 'var(--banner, #ffffff)' }}
        />
        <rect
          x={FLAG_POLE_X}
          y={FLAG_BOT_Y - 10}
          width={FLAG_W}
          height={10}
          rx={2}
          style={{ fill: '#000' }}
          opacity="0.07"
        />
        <rect
          x={FLAG_POLE_X}
          y={FLAG_TOP_Y}
          width={FLAG_W}
          height={FLAG_H}
          rx={2}
          style={{ fill: 'none', stroke: 'var(--accent, #d4af37)', strokeWidth: 1.5 }}
          opacity="0.7"
        />
        <image
          href={CABANA_LOGO_ASSET}
          x={FLAG_LOGO_CX - FLAG_LOGO_SIZE / 2}
          y={FLAG_LOGO_CY - FLAG_LOGO_SIZE / 2}
          width={FLAG_LOGO_SIZE}
          height={FLAG_LOGO_SIZE}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </g>
  );
}
