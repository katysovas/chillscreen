'use client';

import { useState } from 'react';
import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import { MobileStageCard } from './MobileStageCard';
import {
  getPlayerName,
  isValidPlayerName,
  sanitizePlayerNameInput,
} from '@/lib/playerStorage';
import type { VenueRoute } from '@/lib/venueRoutes';

type Props = {
  balloonColor: string;
  initialRoute?: VenueRoute | null;
  onEnter: (name: string, route: VenueRoute) => void;
};

/**
 * Mobile-only welcome — pick a stage, enter your name, land at the show.
 * Desktop never mounts this.
 */
export function MobileStagePicker({ initialRoute, onEnter }: Props) {
  const [draft, setDraft] = useState(() => getPlayerName() ?? '');
  const [picked, setPicked] = useState<VenueRoute | null>(initialRoute ?? null);
  const validName = isValidPlayerName(draft);

  const submit = () => {
    const name = draft.trim();
    if (!isValidPlayerName(name) || !picked) return;
    onEnter(name, picked);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: 'max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'rgb(13,1,34)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 22,
          padding: '28px 20px 24px',
          maxWidth: 400,
          width: '100%',
          fontFamily: "Georgia,'Times New Roman',serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo_dark.svg"
          alt="WhichStage"
          style={{ display: 'block', height: 40, margin: '0 auto 14px', objectFit: 'contain' }}
        />

        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 6 }}>
          Pick your stage
        </div>
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.62)',
            textAlign: 'center',
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          On mobile you&apos;ll land right at the show — chat with friends and NPCs, no walking required.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {MOBILE_LOUNGE_STAGES.map(stage => (
            <MobileStageCard
              key={stage.route}
              stage={stage}
              selected={picked === stage.route}
              onSelect={() => setPicked(stage.route)}
            />
          ))}
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 8,
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          Your name
        </label>
        <input
          type="text"
          value={draft}
          maxLength={24}
          placeholder="What should we call you?"
          autoComplete="nickname"
          onChange={e => setDraft(sanitizePlayerNameInput(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: 16,
            fontFamily: 'system-ui,sans-serif',
            marginBottom: 16,
            outline: 'none',
          }}
        />

        <button
          type="button"
          disabled={!validName || !picked}
          onClick={submit}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: 'none',
            background: validName && picked
              ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
              : 'rgba(255,255,255,0.08)',
            color: validName && picked ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'system-ui,sans-serif',
            cursor: validName && picked ? 'pointer' : 'not-allowed',
          }}
        >
          Enter the show
        </button>
      </div>
    </div>
  );
}
