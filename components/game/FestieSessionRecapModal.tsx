'use client';

import {
  recapLinesFromEvents,
  recapSummary,
  type FestieSessionRecap,
} from '@/lib/festie/sessionRecap';

type Props = {
  festieName: string;
  recap: FestieSessionRecap;
  onDismiss: () => void;
};

function formatRecapTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FestieSessionRecapModal({ festieName, recap, onDismiss }: Props) {
  const lines = recapLinesFromEvents(recap.events, festieName);

  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 235,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-labelledby="festie-recap-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(94vw, 520px)',
          maxHeight: 'min(88vh, 640px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#131415',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
          fontFamily: 'system-ui,sans-serif',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
          <h2
            id="festie-recap-title"
            style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#fff' }}
          >
            While you were away
          </h2>
          <p style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.55)',
          }}>
            {recapSummary(recap, festieName)}
          </p>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {lines.map(line => (
            <div
              key={line.id}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: line.detail ? 6 : 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {line.emoji} {line.title}
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                  flexShrink: 0,
                }}>
                  {formatRecapTime(line.time)}
                </span>
              </div>
              {line.detail && (
                <p style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: 'rgba(255,255,255,0.72)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {line.detail}
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 20px 20px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
              color: '#fff',
            }}
          >
            Back to the festival
          </button>
        </div>
      </div>
    </div>
  );
}
