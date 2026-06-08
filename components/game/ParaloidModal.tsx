'use client';

import { useCallback, useState } from 'react';
import {
  copyParaloidImage,
  downloadParaloid,
  shareParaloidFacebook,
  shareParaloidNative,
  shareParaloidTwitter,
} from '@/lib/paraloidShare';

type ParaloidModalProps = {
  imageUrl: string;
  blob: Blob;
  onClose: () => void;
};

const shareBtn: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.82)',
  borderRadius: 999,
  padding: '9px 16px',
  fontSize: 11,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
  fontFamily: "Georgia,'Times New Roman',serif",
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function ParaloidModal({ imageUrl, blob, onClose }: ParaloidModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const ok = await shareParaloidNative(blob);
      if (!ok) downloadParaloid(blob);
    } finally {
      setSharing(false);
    }
  }, [blob]);

  const handleCopy = useCallback(async () => {
    const ok = await copyParaloidImage(blob);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [blob]);

  return (
    <div
      data-paraloid-ui
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(96vw, 420px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="WhichStage paraloid capture"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 12,
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            display: 'block',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <button type="button" style={shareBtn} onClick={handleShare} disabled={sharing}>
            {sharing ? 'Sharing…' : 'Share'}
          </button>
          <button type="button" style={shareBtn} onClick={shareParaloidTwitter}>
            Post on X
          </button>
          <button type="button" style={shareBtn} onClick={shareParaloidFacebook}>
            Facebook
          </button>
          <button type="button" style={shareBtn} onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy image'}
          </button>
          <button type="button" style={shareBtn} onClick={() => downloadParaloid(blob)}>
            Download
          </button>
          <button
            type="button"
            style={{ ...shareBtn, color: 'rgba(255,255,255,0.55)' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
