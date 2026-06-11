'use client';

import { FestieHeart } from './FestieHeart';
import {
  FESTIE_CONFIG,
  FESTIE_LIVE_DURATION_LABEL,
  festieElapsedMs,
  festieLifeFill,
  type FestieTier,
} from '@/lib/festie/config';

type StepId = 'live' | 'dim';

type Props = {
  festieName: string;
  ownerOnline: boolean;
  tier: FestieTier;
  lastSeenAt: string;
  glowColor: string;
};

type Step = {
  id: StepId;
  kind: 'heart' | 'emoji';
  emoji?: string;
  title: string;
  detail: string;
};

export function FestieLifeTimeline({
  festieName,
  ownerOnline,
  tier,
  lastSeenAt,
  glowColor,
}: Props) {
  const activeId: StepId | null = ownerOnline
    ? null
    : tier === 'dim'
      ? 'dim'
      : tier === 'live'
        ? 'live'
        : null;

  const fill = festieLifeFill(lastSeenAt, ownerOnline);
  const elapsed = festieElapsedMs(lastSeenAt);

  const dimProgress = tier === 'dim'
    ? Math.min(
        1,
        (elapsed - FESTIE_CONFIG.LIVE_WINDOW_MS)
          / (FESTIE_CONFIG.DIM_WINDOW_MS - FESTIE_CONFIG.LIVE_WINDOW_MS),
      )
    : 0;

  const steps: Step[] = [
    {
      id: 'live',
      kind: 'heart',
      title: 'After you leave',
      detail: `${festieName} stays at the festival for ${FESTIE_LIVE_DURATION_LABEL} - walks around, talks to other festies`,
    },
    {
      id: 'dim',
      kind: 'emoji',
      emoji: '💤',
      title: 'Naps',
      detail: `After ${FESTIE_LIVE_DURATION_LABEL} away, naps until you return`,
    },
  ];

  const activeIndex = activeId ? steps.findIndex(s => s.id === activeId) : -1;

  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        Life timeline
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, index) => {
          const isActive = activeId !== null && step.id === activeId;
          const isPast = activeIndex >= 0 && index < activeIndex;
          const isPreview = ownerOnline;

          const connectorProgress =
            isPreview
              ? 0
              : index === 0 && tier === 'live'
                ? fill
                : index === 0 && tier === 'dim'
                  ? 1
                  : isPast
                    ? 1
                    : 0;

          return (
            <div key={step.id} style={{ display: 'flex', gap: 14, minHeight: 0 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 32,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isActive
                      ? `${glowColor}22`
                      : isPast
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.04)',
                    border: isActive
                      ? `2px solid ${glowColor}`
                      : isPast
                        ? '1px solid rgba(255,255,255,0.2)'
                        : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: isActive ? `0 0 14px ${glowColor}44` : 'none',
                    opacity: isPreview ? 0.7 : 1,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  {step.kind === 'heart' ? (
                    <FestieHeart
                      fill={
                        isPreview
                          ? 1
                          : isPast
                            ? 0.15
                            : isActive && tier === 'live'
                              ? fill
                              : 1
                      }
                      glowColor={glowColor}
                      size={18}
                    />
                  ) : (
                    <span style={{ fontSize: 15, lineHeight: 1 }} aria-hidden>
                      {step.emoji}
                    </span>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 20,
                      margin: '4px 0',
                      borderRadius: 1,
                      background: 'rgba(255,255,255,0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    aria-hidden
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: `${connectorProgress * 100}%`,
                        background: isPast || isActive
                          ? `linear-gradient(180deg, ${glowColor}cc, ${glowColor}66)`
                          : glowColor,
                        borderRadius: 1,
                        transition: 'height 0.4s ease',
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  paddingBottom: index < steps.length - 1 ? 18 : 0,
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive
                      ? '#fff'
                      : isPast
                        ? 'rgba(255,255,255,0.55)'
                        : isPreview
                          ? 'rgba(255,255,255,0.5)'
                          : 'rgba(255,255,255,0.4)',
                    lineHeight: 1.3,
                  }}
                >
                  {step.title}
                  {isActive && index > 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        color: glowColor,
                      }}
                    >
                      now
                    </span>
                  )}
                </p>
                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: isActive
                      ? 'rgba(255,255,255,0.72)'
                      : 'rgba(255,255,255,0.38)',
                  }}
                >
                  {step.detail}
                </p>

                {isActive && tier === 'live' && (
                  <div
                    style={{
                      marginTop: 10,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}
                    aria-hidden
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${fill * 100}%`,
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${glowColor}, ${glowColor}aa)`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                )}

                {isActive && tier === 'dim' && (
                  <div
                    style={{
                      marginTop: 10,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}
                    aria-hidden
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${dimProgress * 100}%`,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.35)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p
        style={{
          margin: '14px 0 0',
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
          fontSize: 12,
          lineHeight: 1.45,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Nothing is lost — coming back wakes {festieName} up.
      </p>
    </div>
  );
}
