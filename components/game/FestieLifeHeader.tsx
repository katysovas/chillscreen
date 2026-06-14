'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { FestieHeart } from './FestieHeart';
import {
  FESTIE_CONFIG,
  FESTIE_LIVE_DURATION_LABEL,
  festieElapsedMs,
  festieLifeFill,
  festieTier,
  type FestieTier,
} from '@/lib/festie/config';
import { festieLifeCaption } from '@/lib/festie/lifeCaption';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner } from '@/lib/festie/types';

type Props = {
  festie: FestieOwner;
  ownerOnline: boolean;
  refillFrom?: number | null;
  titleId?: string;
  settingsAction?: ReactNode;
  /** History modal — red 24h life bar instead of caption text. */
  showLifeBar?: boolean;
};

/** Life bar spans the full 24h live window. */
const LIVE_TRACK_PCT = 100;

const LIVE_GREEN = '#4ade80';
const LIVE_RED = '#ff3a1a';
const LIVE_GRADIENT = `linear-gradient(90deg, ${LIVE_GREEN}, #a3e635, #facc15, #fb923c, ${LIVE_RED})`;

/** Smallest painted slice so the bar never looks fully empty at the start. */
const LIVE_FILL_MIN = 0.045;

function festieLiveElapsed(lastSeenAt: string, ownerOnline: boolean, now = Date.now()): number {
  if (ownerOnline) return 0;
  return Math.max(0, Math.min(1, 1 - festieLifeFill(lastSeenAt, ownerOnline, now)));
}

function festieSleepTrackFill(
  lastSeenAt: string,
  tier: FestieTier,
  now = Date.now(),
): number {
  if (tier === 'gone') return 1;
  if (tier !== 'dim') return 0;
  const elapsed = festieElapsedMs(lastSeenAt, now);
  const sleepMs = FESTIE_CONFIG.DIM_WINDOW_MS - FESTIE_CONFIG.LIVE_WINDOW_MS;
  const intoSleep = elapsed - FESTIE_CONFIG.LIVE_WINDOW_MS;
  return Math.max(0, Math.min(1, intoSleep / sleepMs));
}

function FestieLifeBar({
  asleep,
  ownerOnline,
  sleepFill,
  elapsed,
}: {
  asleep: boolean;
  ownerOnline: boolean;
  sleepFill: number;
  elapsed: number;
}) {
  const displayElapsed = asleep ? 0 : Math.max(elapsed, LIVE_FILL_MIN);
  const displayElapsedPct = displayElapsed * 100;
  const statusLabel = asleep ? null : ownerOnline ? 'Active' : 'Alive';
  const endLabel = `${FESTIE_LIVE_DURATION_LABEL} Zzz · sleeping`;

  const labelStyle: CSSProperties = {
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'system-ui,sans-serif',
    lineHeight: 1.2,
  };

  const statusLabelStyle: CSSProperties = {
    ...labelStyle,
    color: asleep ? 'rgba(255,255,255,0.42)' : elapsed < 0.65 ? 'rgba(120, 220, 150, 0.9)' : 'rgba(255, 90, 70, 0.88)',
    fontWeight: 500,
  };

  const sleepLabelStyle: CSSProperties = {
    ...labelStyle,
    textTransform: 'none',
    letterSpacing: '0.06em',
    fontSize: 10,
    color: asleep ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)',
    fontWeight: asleep ? 600 : 400,
    textAlign: 'right',
    flexShrink: 0,
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 'min(100%, 240px)' }}
      role="meter"
      aria-valuenow={asleep ? Math.round(sleepFill * 100) : Math.round(elapsed * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={
        asleep
          ? `Festie is sleeping — ${Math.round(sleepFill * 100)}% through nap window`
          : `Festie ${statusLabel?.toLowerCase() ?? 'active'} — ${Math.round(elapsed * 100)}% of ${FESTIE_LIVE_DURATION_LABEL} elapsed, then sleeping`
      }
    >
      <div
        style={{
          position: 'relative',
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Elapsed time — grows left → right from a small green seed */}
        {!asleep && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${displayElapsedPct}%`,
              overflow: 'hidden',
              transition: 'width 0.5s ease',
            }}
          >
            <div
              style={{
                width: `${LIVE_TRACK_PCT / displayElapsed}%`,
                height: '100%',
                background: LIVE_GRADIENT,
                boxShadow: elapsed > 0.65 ? '0 0 10px rgba(255, 58, 26, 0.4)' : '0 0 8px rgba(74, 222, 128, 0.25)',
              }}
            />
          </div>
        )}

        {asleep && sleepFill > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${sleepFill * 100}%`,
              background: 'rgba(130, 150, 210, 0.35)',
              transition: 'width 0.5s ease',
            }}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
          gap: 8,
        }}
      >
        {statusLabel ? (
          <span style={statusLabelStyle}>{statusLabel}</span>
        ) : (
          <span
            style={{
              ...statusLabelStyle,
              color: 'rgba(255,255,255,0.42)',
              textTransform: 'none',
              fontSize: 11,
            }}
          >
            Zzz · sleeping
          </span>
        )}
        <span style={sleepLabelStyle}>{endLabel}</span>
      </div>
    </div>
  );
}

/** Heart avatar + festie name + status caption (shared by Life modal & settings). */
export function FestieLifeHeader({
  festie,
  ownerOnline,
  refillFrom = null,
  titleId,
  settingsAction,
  showLifeBar = false,
}: Props) {
  const preset = festiePresetById(festie.preset);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!showLifeBar) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [showLifeBar]);

  const fill = festieLifeFill(festie.last_seen_at, ownerOnline, now);
  const elapsed = festieLiveElapsed(festie.last_seen_at, ownerOnline, now);
  const tier = festieTier(new Date(festie.last_seen_at), now);
  const asleep = showLifeBar && !ownerOnline && tier !== 'live';
  const sleepFill = festieSleepTrackFill(festie.last_seen_at, tier, now);
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
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'system-ui,sans-serif',
              minWidth: 0,
            }}
          >
            {festie.name}
          </h2>
          {settingsAction}
        </div>
        <div style={{ marginTop: 8 }}>
          {showLifeBar ? (
            <FestieLifeBar
              elapsed={elapsed}
              asleep={asleep}
              ownerOnline={ownerOnline}
              sleepFill={sleepFill}
            />
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.65)',
                letterSpacing: 0.2,
                fontFamily: 'system-ui,sans-serif',
              }}
            >
              {caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
