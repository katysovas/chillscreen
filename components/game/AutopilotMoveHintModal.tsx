'use client';

import { Z_MODAL_NESTED } from '@/lib/zLayers';

type Props = {
  onClose: () => void;
};

export function AutopilotMoveHintModal({ onClose }: Props) {
  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_MODAL_NESTED,
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
        aria-labelledby="autopilot-move-hint-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(100%, 360px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'linear-gradient(165deg, rgba(18,22,32,0.96) 0%, rgba(10,12,18,0.98) 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          padding: '24px 22px 20px',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 12 }} aria-hidden>
          🤖
        </div>
        <h2
          id="autopilot-move-hint-title"
          style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#fff' }}
        >
          Autopilot is on
        </h2>
        <p style={{
          margin: '0 0 22px',
          color: 'rgba(255,255,255,0.58)',
          fontSize: 14,
          lineHeight: 1.55,
        }}>
          Your festie is wandering on its own. Turn off Autopilot in the bottom-left corner if you want to move.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'system-ui,sans-serif',
            background: '#fff',
            color: '#0a0c12',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
