'use client';

import { FESTIE_LIVE_DURATION_LABEL } from '@/lib/festie/config';

type Props = {
  festieName?: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SignOutConfirmModal({
  festieName,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const name = festieName?.trim();
  const who = name ? `${name}` : 'Your festie';

  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-labelledby="sign-out-title"
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
          👋
        </div>
        <h2
          id="sign-out-title"
          style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#fff' }}
        >
          Leaving already?
        </h2>
        <p style={{
          margin: '0 0 22px',
          color: 'rgba(255,255,255,0.58)',
          fontSize: 14,
          lineHeight: 1.55,
        }}>
          {who} vibes for {FESTIE_LIVE_DURATION_LABEL} without you, then naps. Sign out for a fresh start?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              width: '100%',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'system-ui,sans-serif',
              background: loading ? 'rgba(255,255,255,0.12)' : '#fff',
              color: loading ? 'rgba(255,255,255,0.45)' : '#0a0c12',
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? 'Slipping out…' : 'Yeah, I\'m out'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={{
              width: '100%',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: 15,
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.14)',
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'system-ui,sans-serif',
              background: 'transparent',
              color: 'rgba(255,255,255,0.78)',
            }}
          >
            One more song
          </button>
        </div>
      </div>
    </div>
  );
}
