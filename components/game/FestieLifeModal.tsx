'use client';

import { FestieLifeHeader } from './FestieLifeHeader';
import { FestieLifePanel } from './FestieLifePanel';
import type { FestieOwner } from '@/lib/festie/types';

type Props = {
  festie: FestieOwner;
  ownerOnline: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onUpdated?: (festie: FestieOwner) => void;
  refillFrom?: number | null;
};

export function FestieLifeModal({
  festie,
  ownerOnline,
  onClose,
  onOpenSettings,
  onUpdated,
  refillFrom = null,
}: Props) {
  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="festie-life-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(100%, 380px)',
          maxHeight: 'min(92vh, 640px)',
          overflow: 'auto',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'linear-gradient(165deg, rgba(18,22,32,0.96) 0%, rgba(10,12,18,0.98) 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          padding: '22px 20px 20px',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
          <FestieLifeHeader
            festie={festie}
            ownerOnline={ownerOnline}
            refillFrom={refillFrom}
            titleId="festie-life-title"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <FestieLifePanel
          festie={festie}
          ownerOnline={ownerOnline}
          onUpdated={onUpdated}
        />

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          edit {festie.name}
        </button>
      </div>
    </div>
  );
}
