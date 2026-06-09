'use client';

import { useState } from 'react';
import Character from './Character';
import { isValidPlayerName, sanitizePlayerNameInput } from '@/lib/playerStorage';

type Props = {
  balloonColor: string;
  onEnter: (name: string) => void;
};

/**
 * Full-screen welcome overlay shown on first visit (no stored name).
 * Displays a friendly message, a live character preview with the player's
 * balloon color, and a name input. Submitting dismisses the overlay and
 * starts the game.
 */
export function WelcomePopup({ balloonColor, onEnter }: Props) {
  const [draft, setDraft] = useState('');
  const valid = isValidPlayerName(draft);

  const submit = () => {
    const t = draft.trim();
    if (!isValidPlayerName(t)) return;
    onEnter(t);
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
        background: 'rgb(13,1,34)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: '44px 40px 36px',
        maxWidth: 460,
        width: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        fontFamily: "Georgia,'Times New Roman',serif",
      }}>

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo_dark.svg"
          alt="WhichStage"
          style={{ height: 48, marginBottom: 16, objectFit: 'contain' }}
        />

        {/* Heading */}
        <div style={{
          fontSize: 22, fontWeight: 700, color: '#fff',
          letterSpacing: 0.5, marginBottom: 6, textAlign: 'center',
        }}>
          Welcome to WhichStage
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 16, color: 'rgba(255,255,255,0.6)',
          textAlign: 'center', lineHeight: 1.6, marginBottom: 12,
          fontFamily: "system-ui,sans-serif",
        }}>
          Explore cities. Watch live shows. Make friends.
        </div>

        {/* Character preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
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
            fontSize: 11, color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1.5, textTransform: 'uppercase',
            fontFamily: "system-ui,sans-serif",
            marginTop: 6,
          }}>
            This is you
          </div>
        </div>

        {/* Name prompt */}
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.7)',
          marginBottom: 10, fontFamily: "system-ui,sans-serif",
          alignSelf: 'flex-start', fontWeight: 500,
        }}>
          What&rsquo;s your name?
        </div>

        {/* Name input row */}
        <div style={{
          display: 'flex', gap: 8, width: '100%',
        }}>
          <input
            value={draft}
            onChange={e => setDraft(sanitizePlayerNameInput(e.target.value))}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Your name…"
            autoFocus
            autoComplete="off"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 15,
              color: '#fff',
              outline: 'none',
              fontFamily: "system-ui,sans-serif",
            }}
          />
          <button
            onClick={submit}
            disabled={!valid}
            style={{
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 14, fontWeight: 700,
              cursor: valid ? 'pointer' : 'default',
              border: 'none',
              background: valid
                ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                : 'rgba(255,255,255,0.1)',
              color: valid ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: valid ? '0 2px 10px rgba(230, 126, 34, 0.35)' : 'none',
              transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            Let&apos;s go →
          </button>
        </div>

        {/* What's New */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '14px 18px',
          marginTop: 18,
          fontFamily: "system-ui,sans-serif",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
            marginBottom: 10,
          }}>
            What&apos;s New
          </div>
          {[
            'New state - The Farm!',
            'Fresh party favors dropped at our merch stand',
            'Bring your crew - share link to stage',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              marginBottom: 7,
            }}>
              <span style={{
                flexShrink: 0,
                fontSize: 14,
                color: '#fff',
                fontWeight: 700,
                lineHeight: 1,
              }}>✓</span>
              {item}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
