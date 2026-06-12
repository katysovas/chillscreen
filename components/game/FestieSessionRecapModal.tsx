'use client';

import { useCallback, useMemo, useState } from 'react';
import Character from './Character';
import type { CharacterLoadout } from './characters/loadout';
import {
  formatRecapSessionRange,
  npcConversationPreview,
  npcConversationTurns,
  recapLinesFromEvents,
  recapSummary,
  type FestieSessionRecap,
  type RecapChatTurn,
  type RecapLine,
} from '@/lib/festie/sessionRecap';
import { festiePresetById } from '@/lib/festie/presets';
import type { FestieOwner, FestiePreset } from '@/lib/festie/types';
import {
  FestieNotifyEmailSignup,
  festieNeedsNotifyEmail,
} from './FestieNotifyEmailSignup';

type Props = {
  festieName: string;
  festiePreset?: FestiePreset;
  festie?: FestieOwner | null;
  onFestieUpdated?: (festie: FestieOwner) => void;
  /** Player's equipped vendor props — balloon color comes from festie preset. */
  loadout?: CharacterLoadout;
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

function RecapChatThread({ turns }: { turns: RecapChatTurn[] }) {
  return (
    <div className="festie-recap-chat-thread">
      {turns.map((turn, j) => (
        <div
          key={j}
          className={`festie-recap-chat-row festie-recap-chat-row--${turn.side}`}
        >
          <div className={`festie-recap-chat-bubble festie-recap-chat-bubble--${turn.side}`}>
            <span className="festie-recap-chat-speaker">{turn.speaker}</span>
            <p className="festie-recap-chat-text">{turn.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecapEventBody({
  line,
  festieName,
  expanded,
  onToggleExpand,
}: {
  line: RecapLine;
  festieName: string;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  if (line.kind === 'npc' && line.npcConversation) {
    const convo = line.npcConversation;
    const preview = line.detail ?? npcConversationPreview(convo);
    const turns = npcConversationTurns(convo, festieName);

    return (
      <>
        <p className="festie-recap-event-title">{line.title}</p>
        {expanded ? (
          <RecapChatThread turns={turns} />
        ) : (
          <p className="festie-recap-event-detail">{preview}</p>
        )}
        {turns.length > 0 && (
          <button
            type="button"
            className="festie-recap-view-more"
            onClick={onToggleExpand}
            aria-expanded={expanded}
          >
            {expanded ? 'View less' : 'View more'}
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <p className="festie-recap-event-title">{line.title}</p>
      {line.detail && (
        <p className="festie-recap-event-detail">{line.detail}</p>
      )}
    </>
  );
}

export function FestieSessionRecapModal({
  festieName,
  festiePreset = 'ember',
  festie = null,
  onFestieUpdated,
  loadout,
  recap,
  onDismiss,
  forceShowEmailSignup = false,
}: Props) {
  const who = festieName.trim() || 'Your festie';
  const lines = recapLinesFromEvents(recap.events, who);
  const preset = festiePresetById(festiePreset);
  const festieLoadout = useMemo(
    () => (loadout ? { ...loadout, balloonColor: preset.balloonColor } : undefined),
    [loadout, preset.balloonColor],
  );
  const sessionRange = formatRecapSessionRange(recap.since, recap.until);
  const summary = recapSummary(recap, who);
  const showEmailSignup = Boolean(festie)
    && (forceShowEmailSignup || festieNeedsNotifyEmail(festie));
  const [expandedNpcIds, setExpandedNpcIds] = useState<Set<number>>(() => new Set());

  const toggleNpcExpand = useCallback((id: number) => {
    setExpandedNpcIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="festie-recap-overlay" data-paraloid-ui onClick={onDismiss}>
      <div
        className="festie-recap-card"
        role="dialog"
        aria-labelledby="festie-recap-title"
        onClick={e => e.stopPropagation()}
        style={{ ['--festie-glow' as string]: preset.balloonColor }}
      >
        <header className="festie-recap-header">
          <div className="festie-recap-avatar" aria-hidden>
            <div className="festie-recap-avatar-glow" />
            <div className="festie-recap-avatar-character">
              <Character
                walking={false}
                facing="right"
                dancing={false}
                balloonColor={preset.balloonColor}
                loadout={festieLoadout}
                outfit={preset.outfit}
                scale={0.32}
              />
            </div>
          </div>
          <div className="festie-recap-header-text">
            <p className="festie-recap-eyebrow">While you were away</p>
            <h2 id="festie-recap-title" className="festie-recap-title">{who}</h2>
            <p className="festie-recap-summary">{summary}</p>
            <p className="festie-recap-range">{sessionRange}</p>
          </div>
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
                  <span className="festie-recap-event-dot">{line.emoji}</span>
                  {i < lines.length - 1 && <span className="festie-recap-event-line" />}
                </div>
                <div className="festie-recap-event-body">
                  <time className="festie-recap-event-time" dateTime={line.time}>
                    {formatRecapTime(line.time)}
                  </time>
                  <RecapEventBody
                    line={line}
                    festieName={who}
                    expanded={expandedNpcIds.has(line.id)}
                    onToggleExpand={() => toggleNpcExpand(line.id)}
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <footer className="festie-recap-footer">
          <button type="button" className="festie-recap-btn" onClick={onDismiss}>
            Back to the festival
          </button>
        </footer>
      </div>
    </div>
  );
}
