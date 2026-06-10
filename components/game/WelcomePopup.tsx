'use client';

import { useEffect, useState } from 'react';
import Character from './Character';
import { MobileStageCard } from './MobileStageCard';
import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import { getPlayerName, isValidPlayerName, sanitizePlayerNameInput } from '@/lib/playerStorage';
import { LOGO_PATH } from '@/lib/site';
import type { VenueRoute } from '@/lib/venueRoutes';

type Props = {
  balloonColor: string;
  initialRoute?: VenueRoute;
  onEnter: (name: string, route: VenueRoute) => void;
};

/**
 * Full-screen welcome overlay shown on first visit (no stored name).
 * Displays a friendly message, a live character preview with the player's
 * balloon color, and a name input. Pick a stage and submit to enter.
 */
export function WelcomePopup({ balloonColor, initialRoute, onEnter }: Props) {
  const [draft, setDraft] = useState('');
  const [picked, setPicked] = useState<VenueRoute | null>(initialRoute ?? null);
  const valid = isValidPlayerName(draft);
  const canSubmit = valid && picked !== null;

  useEffect(() => {
    const stored = getPlayerName();
    if (stored) setDraft(stored);
  }, []);

  const submit = () => {
    const name = draft.trim();
    if (!isValidPlayerName(name) || !picked) return;
    onEnter(name, picked);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      animation: 'wlc-fade-in 0.45s ease',
    }}>

      <div style={{
        background: '#000',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '44px 40px 36px',
        maxWidth: 460,
        width: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        fontFamily: "Georgia,'Times New Roman',serif",
      }}>

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PATH}
          alt="WhichStage"
          style={{ height: 48, marginBottom: 16, objectFit: 'contain' }}
        />

        
        {/* Subtext */}
        <div style={{
          fontSize: 16, color: 'rgba(255,255,255,0.6)',
          textAlign: 'center', lineHeight: 1.6, marginBottom: 12,
          fontFamily: "system-ui,sans-serif",
        }}>
          Explore stages. Watch live shows. Make friends.
        </div>

        {/* Character preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: 20 }}>
          <div style={{
            position: 'relative',
            width: 110,
            height: 110,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              animation: 'wlc-char-sway 3s ease-in-out infinite',
            }}>
              <Character
                walking={false}
                facing="right"
                balloonColor={balloonColor}
                scale={0.28}
              />
            </div>
          </div>

          <div style={{
            fontSize: 14, color: 'rgba(255,255,255,0.7)',
            marginTop: 10, marginBottom: 8, fontFamily: "system-ui,sans-serif",
            fontWeight: 500,
          }}>
            What&rsquo;s your name?
          </div>

          <input
            value={draft}
            onChange={e => setDraft(sanitizePlayerNameInput(e.target.value))}
            placeholder="Your name…"
            autoFocus
            autoComplete="off"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${picked && !valid ? 'rgba(230,126,34,0.55)' : 'rgba(255,255,255,0.18)'}`,
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 15,
              color: '#fff',
              outline: 'none',
              fontFamily: "system-ui,sans-serif",
            }}
          />
        </div>

        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.7)',
          marginBottom: 10, fontFamily: "system-ui,sans-serif",
          alignSelf: 'flex-start', fontWeight: 500,
        }}>
          Pick a stage
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          width: '100%',
          marginBottom: 18,
        }}>
          {MOBILE_LOUNGE_STAGES.map(stage => (
            <MobileStageCard
              key={stage.route}
              stage={stage}
              selected={picked === stage.route}
              onSelect={() => setPicked(stage.route)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 15,
            fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'default',
            border: 'none',
            background: canSubmit
              ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
              : 'rgba(255,255,255,0.1)',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
            boxShadow: canSubmit ? '0 2px 10px rgba(230, 126, 34, 0.35)' : 'none',
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Let&apos;s go →
        </button>

      </div>
    </div>
  );
}
