'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activeVenueRoute,
  buildInviteUrl,
  inviteLinkLabel,
} from '@/lib/inviteLink';
import type { VenueRoute } from '@/lib/venueRoutes';

type InviteFriendsProps = {
  worldOff: number;
  playerName: string | null;
  venueRoute?: VenueRoute;
  hidden?: boolean;
};

export function InviteFriends({
  worldOff,
  playerName,
  venueRoute,
  hidden = false,
}: InviteFriendsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const route = useMemo(
    () => activeVenueRoute(worldOff, venueRoute),
    [worldOff, venueRoute],
  );

  const inviteUrl = useMemo(
    () => (route ? buildInviteUrl(route, playerName) : ''),
    [route, playerName],
  );

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can select the text manually */
    }
  }, [inviteUrl]);

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  useEffect(() => {
    setOpen(false);
  }, [route]);

  if (hidden || !route || !inviteUrl) return null;

  return (
    <div
      className="flex flex-col items-center bottom-[max(96px,calc(env(safe-area-inset-bottom)+88px))] md:bottom-6"
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 38,
        pointerEvents: 'auto',
        maxWidth: 'min(92vw, 420px)',
        gap: 10,
      }}
    >
      {open && (
        <div
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,.18)',
            background: 'rgba(8,12,24,.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,.35)',
            animation: 'invite-panel-in 0.2s ease',
          }}
        >
          <style>{`
            @keyframes invite-panel-in {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.45,
              color: 'rgba(255,255,255,.88)',
              wordBreak: 'break-all',
              marginBottom: 10,
            }}
          >
            {inviteLinkLabel(inviteUrl)}
          </div>
          <button
            type="button"
            onClick={copyLink}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,.22)',
              background: copied ? 'rgba(56,216,128,.22)' : 'rgba(255,255,255,.1)',
              color: copied ? 'rgba(180,255,210,.95)' : 'rgba(255,255,255,.9)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          padding: '10px 18px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,.22)',
          background: 'rgba(0,0,0,.42)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,.88)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 0.2,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        }}
      >
        Invite your friends
      </button>
    </div>
  );
}
