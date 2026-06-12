'use client';

import { FestieHeart } from './FestieHeart';
import { festieLifeFill } from '@/lib/festie/config';
import { festieLifeCaption } from '@/lib/festie/lifeCaption';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner } from '@/lib/festie/types';

type Props = {
  festie: FestieOwner;
  ownerOnline: boolean;
  lifeOpen?: boolean;
  hidden?: boolean;
  /** Icon-only button on phone — matches MobileGameControls tray buttons. */
  isMobile?: boolean;
  onToggle: () => void;
};

const CORNER_LEFT = 'max(12px, calc(env(safe-area-inset-left, 0px) + 8px))';

/** Bottom-left life status — heart + time-left bar; opens Life modal. */
export function FestieLifeCorner({
  festie,
  ownerOnline,
  lifeOpen = false,
  hidden = false,
  isMobile = false,
  onToggle,
}: Props) {
  if (hidden) return null;

  const preset = festiePresetById(festie.preset);
  const fill = festieLifeFill(festie.last_seen_at, ownerOnline);
  const caption = festieLifeCaption(ownerOnline, festie.last_seen_at);
  const glow = preset.balloonColor;

  if (isMobile) {
    return (
      <div
        data-paraloid-ui
        className="festie-life-corner-mobile"
        style={{
          position: 'absolute',
          left: CORNER_LEFT,
          zIndex: 45,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          onPointerDown={e => e.preventDefault()}
          aria-label={`Festie life — ${caption}. Open details.`}
          aria-pressed={lifeOpen}
          title={caption}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 12,
            border: lifeOpen
              ? `1px solid ${glow}55`
              : '1px solid rgba(255,255,255,.22)',
            background: lifeOpen ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.42)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            cursor: 'pointer',
            padding: 0,
            userSelect: 'none',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <FestieHeart fill={fill} glowColor={glow} size={22} />
        </button>
      </div>
    );
  }

  return (
    <div
      data-paraloid-ui
      className="bottom-5"
      style={{
        position: 'absolute',
        left: CORNER_LEFT,
        zIndex: 38,
        pointerEvents: 'auto',
        maxWidth: 'min(52vw, 200px)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Festie life — ${caption}. Open details.`}
        aria-pressed={lifeOpen}
        title={caption}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          borderRadius: 999,
          background: lifeOpen ? 'rgba(0,0,0,.44)' : 'rgba(0,0,0,.36)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: lifeOpen
            ? `1px solid ${glow}55`
            : '1px solid rgba(255,255,255,.1)',
          cursor: 'pointer',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <FestieHeart fill={fill} glowColor={glow} size={18} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
            aria-hidden
          >
            <div
              style={{
                height: '100%',
                width: `${fill * 100}%`,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${glow}, ${glow}aa)`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 9,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.55)',
              fontFamily: "Georgia,'Times New Roman',serif",
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {caption}
          </span>
        </div>
      </button>
    </div>
  );
}
