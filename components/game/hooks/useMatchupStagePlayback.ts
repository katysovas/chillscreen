'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { syncedNow, getStageSync } from '@/lib/stageClock';
import { localMatchupVotePreview } from '@/lib/matchup/playlists';
import { trackDurationMs } from '@/lib/matchup/lineups';
import { isMatchupChannel } from '@/lib/matchup/config';
import type { MatchupStatePayload } from '@/lib/matchup/types';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import { useStageLineupMultiplayer } from '../StageLineupMultiplayerContext';

function toStageVideo(track: MatchupStatePayload['current']['track']): StageVideo {
  return {
    id: track.youtubeId,
    title: track.title,
    durationSec: track.durationSec,
  };
}

export type MatchupPlayback = {
  video: StageVideo;
  /** Seek offset baked into embed src — only read when the track identity changes. */
  offsetSec: number;
  msUntilNext: number;
  vidKey: number;
};

export function useMatchupStagePlayback(
  channel: StageChannel,
  live: boolean,
): MatchupPlayback | null {
  const mp = useStageLineupMultiplayer();
  const serverPayloadRef = useRef<MatchupStatePayload | null>(null);
  const boundarySubscribedRef = useRef(false);
  const [trackIdentity, setTrackIdentity] = useState<string | null>(null);

  useEffect(() => {
    if (!live || !isMatchupChannel(channel) || !mp) {
      serverPayloadRef.current = null;
      setTrackIdentity(null);
      return;
    }

    mp.requestConnect();
    const onState = (msg: MatchupStatePayload) => {
      if (msg.channel !== channel) return;
      const prev = serverPayloadRef.current;
      serverPayloadRef.current = msg;
      const id = `${msg.current.startedAt}:${msg.current.track.youtubeId}`;
      const prevId = prev
        ? `${prev.current.startedAt}:${prev.current.track.youtubeId}`
        : null;
      if (id !== prevId) {
        boundarySubscribedRef.current = false;
        setTrackIdentity(id);
      }
    };

    const off = mp.registerMatchupStateHandler(onState);
    return off;
  }, [channel, live, mp]);

  useEffect(() => {
    if (!live || !isMatchupChannel(channel) || !mp) return;
    mp.sendMatchupSubscribe(channel);
  }, [channel, live, mp, mp?.connected]);

  useEffect(() => {
    if (!live || !isMatchupChannel(channel) || !mp || !trackIdentity) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const payload = serverPayloadRef.current;
      if (!payload) return;

      const remaining = payload.current.endsAt - syncedNow();
      if (remaining <= 0) {
        if (!boundarySubscribedRef.current) {
          boundarySubscribedRef.current = true;
          mp.sendMatchupSubscribe(channel);
        }
        return;
      }
      boundarySubscribedRef.current = false;
      timer = setTimeout(schedule, Math.min(remaining, 10_000));
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [channel, live, mp, trackIdentity]);

  return useMemo(() => {
    if (!live || !isMatchupChannel(channel)) return null;

    const payload = serverPayloadRef.current;
    if (payload?.current.track.youtubeId) {
      const { current } = payload;
      const now = syncedNow();
      return {
        video: toStageVideo(current.track),
        offsetSec: Math.max(0, Math.floor((now - current.startedAt) / 1000)),
        msUntilNext: Math.max(0, current.endsAt - now),
        vidKey: current.startedAt,
      };
    }

    const preview = localMatchupVotePreview(channel, getStageSync());
    if (!preview?.voteA.youtubeId) return null;
    const { voteA } = preview;
    const sync = getStageSync();
    const durMs = trackDurationMs(voteA, sync.defaultDurationMs);
    const now = syncedNow();
    return {
      video: toStageVideo(voteA),
      offsetSec: 0,
      msUntilNext: durMs,
      vidKey: now,
    };
  }, [channel, live, trackIdentity]);
}
