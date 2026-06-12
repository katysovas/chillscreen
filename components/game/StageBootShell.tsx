'use client';

import { LOGO_PATH } from '@/lib/site';

type Props = {
  visible?: boolean;
};

/** Full-screen boot shell — dark backdrop with centered logo while auth/bundle loads. */
export function StageBootShell({ visible = true }: Props) {
  return (
    <div
      className="stage-boot-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading WhichStage"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="stage-boot-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_PATH} alt="WhichStage" className="stage-boot-logo" />
        <p className="stage-boot-label">Loading…</p>
      </div>
      <style>{`
        .stage-boot-shell {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #000;
          transition: opacity 320ms ease;
        }
        .stage-boot-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }
        .stage-boot-logo {
          display: block;
          height: 44px;
          width: auto;
          max-width: min(72vw, 280px);
          object-fit: contain;
          opacity: 0.92;
        }
        .stage-boot-label {
          margin: 0;
          font-family: system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.38);
          animation: stage-boot-pulse 1.8s ease-in-out infinite;
        }
        @keyframes stage-boot-pulse {
          0%, 100% { opacity: 0.38; }
          50% { opacity: 0.72; }
        }
      `}</style>
    </div>
  );
}
