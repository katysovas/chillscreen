'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activeVenueRoute,
  buildInviteUrl,
  inviteLinkLabel,
} from '@/lib/inviteLink';
import type { VenueRoute } from '@/lib/venueRoutes';
import { SignOutIcon } from './BottomControlPanel';
import './GameControlBar.css';

type Props = {
  worldOff: number;
  playerName: string | null;
  venueRoute?: VenueRoute;
  creatorStageSlug?: string | null;
  hidden?: boolean;
  showCreateStage?: boolean;
  showSignOut?: boolean;
  onSignOut?: () => void;
};

/** Bottom-right actions — create stage, invite, sign out. */
export function RightControlPanel({
  worldOff,
  playerName,
  venueRoute,
  creatorStageSlug = null,
  hidden = false,
  showCreateStage = false,
  showSignOut = false,
  onSignOut,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const route = useMemo(
    () => activeVenueRoute(worldOff, venueRoute),
    [worldOff, venueRoute],
  );

  const inviteUrl = useMemo(
    () => (route ? buildInviteUrl(route, playerName, creatorStageSlug) : ''),
    [route, playerName, creatorStageSlug],
  );

  const showInvite = Boolean(inviteUrl);

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
    setInviteOpen(false);
  }, [hidden, route]);

  if (hidden || (!showCreateStage && !showInvite && !showSignOut)) {
    return null;
  }

  return (
    <div
      data-paraloid-ui
      className="hidden md:block bottom-5"
      style={{
        position: 'absolute',
        right: 'max(12px, calc(env(safe-area-inset-right, 0px) + 8px))',
        zIndex: 38,
        pointerEvents: 'auto',
      }}
    >
      <div className={['game-control-bar', inviteOpen ? 'game-control-bar--open' : ''].filter(Boolean).join(' ')}>
        {showCreateStage && (
          <Link href="/create" className="game-control-bar__text-btn" style={{ textDecoration: 'none' }}>
            Create New Stage
          </Link>
        )}

        {showCreateStage && showInvite && (
          <div className="game-control-bar__divider" aria-hidden />
        )}

        {showInvite && (
          <>
            <button
              type="button"
              className={[
                'game-control-bar__text-btn',
                inviteOpen ? 'game-control-bar__text-btn--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setInviteOpen(open => !open)}
              aria-expanded={inviteOpen}
            >
              Invite Friends
            </button>
            {inviteOpen && (
              <>
                <span className="game-control-bar__dot" aria-hidden>·</span>
                <span className="game-control-bar__mono">{inviteLinkLabel(inviteUrl)}</span>
                <span className="game-control-bar__dot" aria-hidden>·</span>
                <button
                  type="button"
                  className="game-control-bar__text-btn"
                  onClick={() => void copyLink()}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </>
            )}
          </>
        )}

        {(showCreateStage || showInvite) && showSignOut && (
          <div className="game-control-bar__divider" aria-hidden />
        )}

        {showSignOut && (
          <button
            type="button"
            className="game-control-bar__text-btn"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <SignOutIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
