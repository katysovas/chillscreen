'use client';

import type { FestieEventRow } from '@/lib/festie/events';
import { recapLinesFromEvents } from '@/lib/festie/sessionRecap';
import { CoinIcon } from './CoinIcon';

type Props = {
  events: FestieEventRow[];
  festieName: string;
  emptyMessage?: string;
};

function formatRecapTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function FestieRecapTimeline({
  events,
  festieName,
  emptyMessage = 'Nothing logged since your last visit.',
}: Props) {
  const lines = recapLinesFromEvents(events, festieName);

  if (lines.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          padding: '12px 4px 4px',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
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
  );
}
