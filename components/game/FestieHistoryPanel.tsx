'use client';

import { useEffect, useState } from 'react';
import { fetchFestieHistorySince, historySinceForFestie } from '@/lib/festie/client';
import { formatRecapSessionRange, type FestieSessionRecap } from '@/lib/festie/sessionRecap';
import { getLastAckedRecapSince } from '@/lib/festie/sessionRecapStorage';
import type { FestieOwner } from '@/lib/festie/types';
import { FestieRecapTimeline } from './FestieRecapTimeline';

type Props = {
  festie: FestieOwner;
  /** Cached recap from the popup — same events, no refetch needed. */
  sessionRecap?: FestieSessionRecap | null;
};

export function FestieHistoryPanel({ festie, sessionRecap = null }: Props) {
  const [loading, setLoading] = useState(!sessionRecap);
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<FestieSessionRecap | null>(sessionRecap);

  useEffect(() => {
    if (sessionRecap) {
      setRecap(sessionRecap);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const since = historySinceForFestie(festie, getLastAckedRecapSince(festie.id));

    void fetchFestieHistorySince(since, festie.name)
      .then(next => {
        if (cancelled) return;
        setRecap(next);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load history');
        setRecap(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [festie.id, festie.last_seen_at, festie.name, sessionRecap]);

  if (loading) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        Loading history…
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255, 160, 140, 0.9)' }}>
        {error}
      </p>
    );
  }

  if (!recap || recap.events.length === 0) {
    return (
      <FestieRecapTimeline
        events={[]}
        festieName={festie.name}
        emptyMessage="Nothing logged since your last visit."
      />
    );
  }

  return (
    <div className="festie-life-history-panel">
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 11,
          letterSpacing: 0.08,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.38)',
        }}
      >
        {formatRecapSessionRange(recap.since, recap.until)}
      </p>
      <FestieRecapTimeline events={recap.events} festieName={festie.name} />
    </div>
  );
}
