'use client';

import type { ReactNode } from 'react';
import { Z_MODAL } from '@/lib/zLayers';

type Props = {
  title: string;
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
};

export function CreatorStageModalShell({
  title,
  ariaLabel,
  onClose,
  children,
  width = 680,
}: Props) {
  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_MODAL,
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
        aria-label={ariaLabel}
        onClick={e => e.stopPropagation()}
        style={{
          width: `min(100%, ${width}px)`,
          maxHeight: 'min(92vh, 840px)',
          overflow: 'auto',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'linear-gradient(165deg, rgba(18,22,32,0.96) 0%, rgba(10,12,18,0.98) 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          padding: '22px 22px 20px',
          fontFamily: 'system-ui,sans-serif',
          color: '#fff',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
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
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
