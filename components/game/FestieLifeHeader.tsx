'use client';

import { FestieHeart } from './FestieHeart';
import { festieLifeFill } from '@/lib/festie/config';
import { festieLifeCaption } from '@/lib/festie/lifeCaption';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner } from '@/lib/festie/types';

type Props = {
  festie: FestieOwner;
  ownerOnline: boolean;
  refillFrom?: number | null;
  titleId?: string;
};

/** Heart avatar + festie name + status caption (shared by Life modal & settings). */
export function FestieLifeHeader({
  festie,
  ownerOnline,
  refillFrom = null,
  titleId,
}: Props) {
  const preset = festiePresetById(festie.preset);
  const fill = festieLifeFill(festie.last_seen_at, ownerOnline);
  const caption = festieLifeCaption(ownerOnline, festie.last_seen_at, refillFrom);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FestieHeart
          fill={fill}
          glowColor={preset.balloonColor}
          size={40}
          animateRefillFrom={refillFrom}
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <h2
          id={titleId}
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          {festie.name}
        </h2>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: 0.2,
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}
