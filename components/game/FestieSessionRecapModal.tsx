'use client';

import { useEffect } from 'react';
import {
  recapLinesFromEvents,
  type FestieSessionRecap,
} from '@/lib/festie/sessionRecap';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner, FestiePreset } from '@/lib/festie/types';
import {
  FestieNotifyEmailSignup,
  festieNeedsNotifyEmail,
} from './FestieNotifyEmailSignup';
import { CoinIcon } from './CoinIcon';

const RECAP_AUTO_DISMISS_MS = 15_000;

type Props = {
  festieName: string;
  festiePreset?: FestiePreset;
  festie?: FestieOwner | null;
  onFestieUpdated?: (festie: FestieOwner) => void;
  recap: FestieSessionRecap;
  onDismiss: () => void;
  /** Dev — show email banner even when notify_email is already set. */
  forceShowEmailSignup?: boolean;
};

function formatRecapTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function FestieSessionRecapModal({
  festieName,
  festiePreset = 'ember',
  festie = null,
  onFestieUpdated,
  recap,
  onDismiss,
  forceShowEmailSignup = false,
}: Props) {
  const who = festieName.trim() || 'Your festie';
  const lines = recapLinesFromEvents(recap.events, who);
  const preset = festiePresetById(festiePreset);
  const showEmailSignup = Boolean(festie)
    && (forceShowEmailSignup || festieNeedsNotifyEmail(festie));

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, RECAP_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

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

      <div className="festie-recap-timeline-wrap">
        <ol className="festie-recap-timeline">
          {lines.map((line, i) => (
            <li key={line.id} className="festie-recap-event">
                <div className="festie-recap-event-rail" aria-hidden>
                  <span className={`festie-recap-event-dot${line.kind === 'coin' ? ' festie-recap-event-dot--coin' : ''}`}>
                    {line.kind === 'coin' ? <CoinIcon size={16} variant="buy" /> : line.emoji}
                  </span>
                {i < lines.length - 1 && <span className="festie-recap-event-line" />}
              </div>
              <div className="festie-recap-event-body">
                <time className="festie-recap-event-time" dateTime={line.time}>
                  {formatRecapTime(line.time)}
                </time>
                <p className="festie-recap-event-title">{line.title}</p>
                {line.detail && (
                  <p className="festie-recap-event-detail">{line.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
