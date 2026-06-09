'use client';

import { useState } from 'react';
import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import type { VenueRoute } from '@/lib/venueRoutes';
import { MobileStageCard } from './MobileStageCard';

type Props = {
  currentRoute: VenueRoute | null;
  onSwap: (route: VenueRoute) => void;
  onClose: () => void;
};

/** Mobile-only — pick another lounge stage without re-entering name. */
export function MobileStageSwapModal({ currentRoute, onSwap, onClose }: Props) {
  const [picked, setPicked] = useState<VenueRoute | null>(currentRoute);
  const canSwap = picked != null && picked !== currentRoute;

  const submit = () => {
    if (!canSwap || !picked) return;
    onSwap(picked);
  };

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="mobile-stage-swap-title"
      onClick={onClose}
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
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgb(13,1,34)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 22,
          padding: '24px 20px 20px',
          maxWidth: 400,
          width: '100%',
          fontFamily: "Georgia,'Times New Roman',serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          ×
        </button>

        <div
          id="mobile-stage-swap-title"
          style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 6 }}
        >
          Change stage
        </div>
        

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 16,
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

        <button
          type="button"
          disabled={!canSwap}
          onClick={submit}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: 'none',
            background: canSwap
              ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
              : 'rgba(255,255,255,0.08)',
            color: canSwap ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'system-ui,sans-serif',
            cursor: canSwap ? 'pointer' : 'not-allowed',
          }}
        >
          Go to stage
        </button>
      </div>
    </div>
  );
}
