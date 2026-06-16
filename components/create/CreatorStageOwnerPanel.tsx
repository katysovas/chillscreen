'use client';

import { useState } from 'react';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { takedownUserStage } from '@/lib/stages/client';
import { useRouter } from 'next/navigation';

export function CreatorStageOwnerPanel() {
  const ctx = useCreatorStageControls();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ctx?.isOwner) return null;

  const { stage, swapNowPlaying } = ctx;

  const handleTakedown = async () => {
    if (!window.confirm('Take down this stage immediately? The link will stop working.')) return;
    setBusy(true);
    setError(null);
    try {
      await takedownUserStage(stage.slug);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Takedown failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 900,
          borderRadius: 999,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 700,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(20,20,22,0.92)',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'system-ui,sans-serif',
          backdropFilter: 'blur(8px)',
        }}
      >
        Stage controls
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Stage controls"
          style={{
            position: 'fixed',
            bottom: 64,
            right: 16,
            zIndex: 901,
            width: 'min(320px, calc(100vw - 32px))',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(18,18,20,0.96)',
            padding: 16,
            fontFamily: 'system-ui,sans-serif',
            color: '#fff',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Lineup</div>
          <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'grid', gap: 6 }}>
            {stage.streams.map((s, i) => (
              <li key={s.videoId}>
                <button
                  type="button"
                  disabled={busy || i === stage.nowPlayingIndex}
                  onClick={() => void swapNowPlaying(i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    border: i === stage.nowPlayingIndex
                      ? '1px solid rgba(230,126,34,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: i === stage.nowPlayingIndex
                      ? 'rgba(230,126,34,0.14)'
                      : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    cursor: i === stage.nowPlayingIndex ? 'default' : 'pointer',
                  }}
                >
                  {i === stage.nowPlayingIndex ? '▶ ' : ''}{s.title}
                </button>
              </li>
            ))}
          </ul>

          {error && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#ff6b6b' }}>{error}</p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleTakedown()}
            style={{
              width: '100%',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid rgba(255,80,80,0.35)',
              background: 'rgba(255,80,80,0.1)',
              color: '#ff8a8a',
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Take down stage
          </button>
        </div>
      )}
    </>
  );
}
