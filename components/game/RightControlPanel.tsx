'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  activeVenueRoute,
  buildInviteUrl,
} from '@/lib/inviteLink';
import type { VenueRoute } from '@/lib/venueRoutes';
import { SignOutIcon } from './BottomControlPanel';
import { InviteFriendsModal } from './InviteFriendsModal';
import './GameControlBar.css';

type Props = {
  worldOff: number;
  playerName: string | null;
  venueRoute?: VenueRoute;
  creatorStageSlug?: string | null;
  stageTitle?: string;
  hidden?: boolean;
  showCreateStage?: boolean;
  onCreateStage?: () => void;
  showSignOut?: boolean;
  onSignOut?: () => void;
};

/** Bottom-right actions — create stage, invite, sign out. */
export function RightControlPanel({
  worldOff,
  playerName,
  venueRoute,
  creatorStageSlug = null,
  stageTitle = 'this stage',
  hidden = false,
  showCreateStage = false,
  onCreateStage,
  showSignOut = false,
  onSignOut,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const route = useMemo(
    () => activeVenueRoute(worldOff, venueRoute),
    [worldOff, venueRoute],
  );

  const inviteUrl = useMemo(
    () => (route ? buildInviteUrl(route, playerName, creatorStageSlug) : ''),
    [route, playerName, creatorStageSlug],
  );

  const showInvite = Boolean(inviteUrl);

  useEffect(() => {
    setInviteOpen(false);
  }, [hidden, route]);

  if (hidden || (!showCreateStage && !showInvite && !showSignOut)) {
    return null;
  }

  return (
    <>
      {inviteOpen && inviteUrl ? (
        <InviteFriendsModal
          stageTitle={stageTitle}
          inviteUrl={inviteUrl}
          onClose={() => setInviteOpen(false)}
        />
      ) : null}

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
        <div className="game-control-bar">
        {showCreateStage && (
          onCreateStage ? (
            <button
              type="button"
              className="game-control-bar__text-btn"
              onClick={onCreateStage}
            >
              Create New Stage
            </button>
          ) : (
            <Link href="/create" className="game-control-bar__text-btn" style={{ textDecoration: 'none' }}>
              Create New Stage
            </Link>
          )
        )}

        {showCreateStage && showInvite && (
          <div className="game-control-bar__divider" aria-hidden />
        )}

        {showInvite && (
          <button
            type="button"
            className="game-control-bar__text-btn"
            onClick={() => setInviteOpen(true)}
            aria-haspopup="dialog"
          >
            Invite Friends
          </button>
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
    </>
  );
}
