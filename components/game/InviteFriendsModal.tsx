'use client';

import { useCallback, useMemo, useState } from 'react';
import { inviteLinkLabel } from '@/lib/inviteLink';
import {
  buildStageShareMessage,
  copyStageShareLink,
  nativeStageShare,
  openStageSharePlatform,
  type StageSharePlatform,
} from '@/lib/stageShare';
import { Z_MODAL } from '@/lib/zLayers';

type Props = {
  stageTitle: string;
  inviteUrl: string;
  onClose: () => void;
};

type ShareOption = {
  id: StageSharePlatform;
  label: string;
  accent: string;
  icon: React.ReactNode;
};

function ShareGlyph({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'x',
    label: 'X',
    accent: '#ffffff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.3 4h3.1l-6.8 7.8L21.5 20h-6.2l-4.9-6.4-5.6 6.4H1.6l7.3-8.4L2.5 4h6.4l4.4 5.8L17.3 4Zm-1.1 14.3h1.7L8 5.6H6.2l10 12.7Z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    accent: '#8ab4ff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14 8.5V6.7c0-.8.2-1.3 1.3-1.3H17V2.9h-2.4C12.1 2.9 11 4.4 11 6.2V8.5H8.5v3.1H11V22h3V11.6h2.6l.4-3.1H14Z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    accent: '#7dffb0',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.7-1-.6-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4.1-.1.1-.2.2-.3.1-.1 0-.2 0-.3-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3h-.5c-.2 0-.3 0-.4.2-.1.2-.6.7-.6 1.7s.6 2 1.4 2.7c.8.7 1.7 1 2 1.1.3.1.5.1.7 0 .2-.1.6-.2.7-.5.1-.3.1-.5.2-.5.1 0 .2 0 .4-.1Z" />
      </svg>
    ),
  },
  {
    id: 'telegram',
    label: 'Telegram',
    accent: '#7dd3fc',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.9 4.6 2.8 11.8c-1.1.4-1.1 1.1-.2 1.4l4.9 1.5 1.9 5.8c.2.6.4.8.8.8.4 0 .6-.2.9-.6l2.7-2.6 5.6 4.1c1 .6 1.7.3 1.9-1l3.3-15.4c.3-1.2-.4-1.7-1.4-1.4ZM9.2 13.8l9.9-6.2c.5-.3.9-.1.5.2L11 15.1l-.4 3.7-1.4-5Z" />
      </svg>
    ),
  },
  {
    id: 'reddit',
    label: 'Reddit',
    accent: '#ffb199',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14.5 11.6c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5ZM9 11.6c0 .8-.7 1.5-1.5 1.5S6 12.4 6 11.6 6.7 10 7.5 10 9 10.8 9 11.6Zm8.8 3.3c.6.6.8 1.5.2 2.3-.9 1.2-3.1 2.5-6 2.5s-5.1-1.3-6-2.5c-.6-.8-.4-1.7.2-2.3.6-.6 1.5-.8 2.3-.2.7.5 2.2 1.3 3.5 1.3s2.8-.8 3.5-1.3c.8-.6 1.7-.4 2.3.2ZM20 12a2 2 0 0 0 1.6-1.9l1.9-.3a1 1 0 0 0 .8-1.1l-.3-1.9a1 1 0 0 0-1.1-.8l-1.9.3A6.2 6.2 0 0 0 16.4 4l-.3-1.9a1 1 0 0 0-1.1-.8h-1.9a1 1 0 0 0-1 .8L11.8 4a6.2 6.2 0 0 0-2.6-1.1l-1.9-.3a1 1 0 0 0-1.1.8L5.9 4.5A6.2 6.2 0 0 0 3.3 6 1 1 0 0 0 2.2 6.8l-.3 1.9a1 1 0 0 0 .8 1.1l1.9.3A2 2 0 0 0 4 12a2 2 0 0 0-.5 1.3l-1.9.3a1 1 0 0 0-.8 1.1l.3 1.9a1 1 0 0 0 1.1.8l1.9-.3A6.2 6.2 0 0 0 7.6 20l.3 1.9a1 1 0 0 0 1 .8h1.9a1 1 0 0 0 1.1-.8l.3-1.9a6.2 6.2 0 0 0 2.6 1.1l1.9.3a1 1 0 0 0 1.1-.8l.3-1.9a6.2 6.2 0 0 0 2.6-1.1l1.9.3a1 1 0 0 0 1.1-.8l-.3-1.9a1 1 0 0 0-.8-1.1l-1.9-.3A2 2 0 0 0 20 12Z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    accent: '#93c5fd',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M6.5 8.8h3V20h-3V8.8Zm1.5-5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM10 8.8h2.9v1.5h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V20h-3v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H10V8.8Z" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    accent: '#f5d0fe',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path d="m5 8 7 5 7-5" />
      </svg>
    ),
  },
];

const shareBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.88)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
};

export function InviteFriendsModal({ stageTitle, inviteUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shareTarget = useMemo(() => ({
    url: inviteUrl,
    stageTitle,
    message: buildStageShareMessage(stageTitle, inviteUrl),
  }), [inviteUrl, stageTitle]);

  const handleCopy = useCallback(async () => {
    const ok = await copyStageShareLink(inviteUrl);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [inviteUrl]);

  const handleNativeShare = useCallback(async () => {
    setSharing(true);
    try {
      await nativeStageShare(shareTarget);
    } finally {
      setSharing(false);
    }
  }, [shareTarget]);

  const handlePlatform = useCallback((platform: StageSharePlatform) => {
    openStageSharePlatform(platform, shareTarget);
  }, [shareTarget]);

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

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
        aria-labelledby="invite-friends-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(100%, 420px)',
          maxHeight: 'min(90vh, 720px)',
          overflow: 'auto',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'linear-gradient(165deg, rgba(18,22,32,0.96) 0%, rgba(10,12,18,0.98) 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          padding: '22px 20px 20px',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2
            id="invite-friends-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}
          >
            Invite friends
          </h2>
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

       

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 8,
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.28)',
          }}
        >
          <code
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11,
              lineHeight: 1.45,
              color: 'rgba(255,255,255,0.78)',
              wordBreak: 'break-all',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {inviteLinkLabel(inviteUrl)}
          </code>
          <button
            type="button"
            onClick={() => void handleCopy()}
            style={{
              flexShrink: 0,
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'rgba(255,240,250,0.92)',
              background: 'linear-gradient(135deg, rgba(255,100,180,0.45), rgba(140,120,255,0.4))',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {canNativeShare ? (
          <button
            type="button"
            style={{ ...shareBtn, marginBottom: 12 }}
            onClick={() => void handleNativeShare()}
            disabled={sharing}
          >
            <ShareGlyph>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M12 5v10M8 9l4-4 4 4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ShareGlyph>
            {sharing ? 'Opening share…' : 'Share via device'}
          </button>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SHARE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              style={shareBtn}
              onClick={() => handlePlatform(option.id)}
            >
              <ShareGlyph>{option.icon}</ShareGlyph>
              <span style={{ color: option.accent }}>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
