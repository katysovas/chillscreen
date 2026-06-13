'use client';

import { useEffect } from 'react';
import { type FestieSessionRecap } from '@/lib/festie/sessionRecap';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner, FestiePreset } from '@/lib/festie/types';
import {
  FestieNotifyEmailSignup,
  festieNeedsNotifyEmail,
} from './FestieNotifyEmailSignup';
import { FestieRecapTimeline } from './FestieRecapTimeline';

const RECAP_AUTO_DISMISS_MS = 15_000;

type Props = {
  festieName: string;
  festiePreset?: FestiePreset;
  festie?: FestieOwner | null;
  onFestieUpdated?: (festie: FestieOwner) => void;
  recap: FestieSessionRecap;
  onDismiss: () => void;
  isMobile?: boolean;
  /** Dev — show email banner even when notify_email is already set. */
  forceShowEmailSignup?: boolean;
};

export function FestieSessionRecapModal({
  festieName,
  festiePreset = 'ember',
  festie = null,
  onFestieUpdated,
  recap,
  onDismiss,
  isMobile = false,
  forceShowEmailSignup = false,
}: Props) {
  const who = festieName.trim() || 'Your festie';
  const preset = festiePresetById(festiePreset);
  const showEmailSignup = Boolean(festie)
    && (forceShowEmailSignup || festieNeedsNotifyEmail(festie));

  useEffect(() => {
    if (isMobile) return;
    const timer = window.setTimeout(onDismiss, RECAP_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, isMobile]);

  return (
    <div
      className="festie-recap-card"
      role="dialog"
      aria-labelledby="festie-recap-title"
      style={{ ['--festie-glow' as string]: preset.balloonColor }}
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        className="festie-recap-close"
        onClick={onDismiss}
        aria-label="Dismiss recap"
      >
        ×
      </button>

      <header className="festie-recap-header">
        <h2 id="festie-recap-title" className="festie-recap-title">While you were away</h2>
      </header>

      {showEmailSignup && festie && (
        <FestieNotifyEmailSignup
          festie={festie}
          onUpdated={onFestieUpdated}
          inputId="festie-recap-email-banner"
          variant="recap"
        />
      )}

      <FestieRecapTimeline events={recap.events} festieName={who} />
    </div>
  );
}
