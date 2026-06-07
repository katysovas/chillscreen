'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activeVenueRoute,
  buildInviteUrl,
  inviteLinkLabel,
} from '@/lib/inviteLink';
import type { VenueRoute } from '@/lib/venueRoutes';

type BottomControlPanelProps = {
  worldOff: number;
  playerName: string | null;
  venueRoute?: VenueRoute;
  connectName?: string | null;
  hidden?: boolean;
};

const hintText: React.CSSProperties = {
  color: 'rgba(255,255,255,.55)',
  fontSize: 10,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
  fontFamily: "Georgia,'Times New Roman',serif",
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'rgba(255,255,255,.65)',
  fontSize: 10,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
  fontFamily: "Georgia,'Times New Roman',serif",
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

/** Bottom-center panel — invite, connect hints, and future stage actions. */
export function BottomControlPanel({
  worldOff,
  playerName,
  venueRoute,
  connectName = null,
  hidden = false,
}: BottomControlPanelProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const route = useMemo(
    () => activeVenueRoute(worldOff, venueRoute),
    [worldOff, venueRoute],
  );

  const inviteUrl = useMemo(
    () => (route ? buildInviteUrl(route, playerName) : ''),
    [route, playerName],
  );

  const showInvite = Boolean(route && inviteUrl);
  const showConnect = Boolean(connectName?.trim());
  const showInviteBtn = showInvite && !showConnect;
  const visible = !hidden && (showInviteBtn || showConnect);

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }, [inviteUrl]);

  useEffect(() => {
    if (hidden || showConnect) setInviteOpen(false);
  }, [hidden, showConnect]);

  useEffect(() => {
    setInviteOpen(false);
  }, [route]);

  if (!visible) return null;

  return (
    <div
      className="bottom-[max(108px,calc(env(safe-area-inset-bottom)+100px))] md:bottom-5"
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 38,
        pointerEvents: 'auto',
        maxWidth: 'min(96vw, 560px)',
      }}
    >
      <div
        style={{
          borderRadius: 999,
          padding: '7px 16px',
          background: 'rgba(0,0,0,.36)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'nowrap',
        }}
      >
        {showConnect && (
          <span style={hintText}>↵ connect with {connectName}</span>
        )}
        {showInviteBtn && (
          <button
            type="button"
            onClick={() => setInviteOpen(o => !o)}
            aria-expanded={inviteOpen}
            style={{
              ...ghostBtn,
              color: inviteOpen ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.65)',
            }}
          >
            Invite Friends
          </button>
        )}
        {inviteOpen && showInviteBtn && (
          <>
            <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, userSelect: 'none' }}>·</span>
            <span
              style={{
                maxWidth: 'min(42vw, 200px)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 10,
                color: 'rgba(255,255,255,.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {inviteLinkLabel(inviteUrl)}
            </span>
            <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, userSelect: 'none' }}>·</span>
            <button type="button" onClick={copyLink} style={ghostBtn}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
