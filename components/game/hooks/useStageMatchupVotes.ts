'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Multiplayer } from '@/lib/multiplayer/useMultiplayer';
import type { MatchupStatePayload } from '@/lib/matchup/types';
import { BADGE_DEBOUNCE_MS } from '@/lib/matchup/constants';
import { isMatchupChannel } from '@/lib/matchup/config';
import { matchupDisplayPercents } from '@/lib/matchup/display';
import { lineupDisplayForVideo } from '@/lib/stageLineup';
import { matchupConfigFor, localMatchupVotePreview } from '@/lib/matchup/playlists';
import { trackDurationMs } from '@/lib/matchup/lineups';
import { getStageSync, subscribeStageSync, syncedNow } from '@/lib/stageClock';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import {
  getOrCreatePlayerId,
  getPlayerSession,
  isPlayerSessionReady,
  subscribePlayerSession,
} from '@/lib/player/session';
import { isSuperAdminFestieName } from '@/lib/superAdmin';
import { useStageVideoMeta } from './useStageVideoMeta';

type MatchupMultiplayer = Pick<
  Multiplayer,
  | 'connected'
  | 'requestConnect'
  | 'sendMatchupSubscribe'
  | 'sendMatchupVote'
  | 'registerMatchupStateHandler'
>;

function localCountdownMs(channel: StageChannel): number {
  const preview = localMatchupVotePreview(channel, getStageSync());
  if (!preview?.voteA.youtubeId) return 0;
  const sync = getStageSync();
  return trackDurationMs(preview.voteA, sync.defaultDurationMs);
}

export function useStageMatchupVotes(
  channel: StageChannel,
  mp: MatchupMultiplayer | null,
) {
  const [payload, setPayload] = useState<MatchupStatePayload | null>(null);
  const [shareSynced, setShareSynced] = useState(false);
  const [msUntilNext, setMsUntilNext] = useState(0);
  const endsAtRef = useRef<number | null>(null);
  const [sessionReady, setSessionReady] = useState(isPlayerSessionReady);
  const [localMyVote, setLocalMyVote] = useState<'a' | 'b' | null>(null);
  const [swapPendingLive, setSwapPendingLive] = useState(false);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPlayerSessionReady()) {
      setSessionReady(true);
      return;
    }
    return subscribePlayerSession(() => {
      if (isPlayerSessionReady()) setSessionReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mp || !isMatchupChannel(channel)) return;
    mp.requestConnect();
  }, [channel, mp]);

  useEffect(() => {
    if (!mp || !isMatchupChannel(channel)) {
      setPayload(null);
      setShareSynced(false);
      endsAtRef.current = null;
      return;
    }

    const onState = (msg: MatchupStatePayload) => {
      if (msg.channel !== channel) return;
      setShareSynced(true);
      endsAtRef.current = syncedNow() + msg.msUntilNext;
      setMsUntilNext(msg.msUntilNext);
      setPayload(prev => {
        const boundaryChanged = prev != null
          && prev.current.startedAt !== msg.current.startedAt;
        if (boundaryChanged) setLocalMyVote(null);
        else if (msg.myVote !== undefined) setLocalMyVote(msg.myVote ?? null);
        return {
          ...msg,
          myVote: msg.myVote !== undefined
            ? (msg.myVote ?? null)
            : boundaryChanged
              ? null
              : (prev?.myVote ?? null),
        };
      });
    };

    const off = mp.registerMatchupStateHandler(onState);
    return off;
  }, [channel, mp]);

  useEffect(() => {
    if (!mp || !isMatchupChannel(channel) || !sessionReady) return;
    mp.sendMatchupSubscribe(channel);
  }, [channel, mp, sessionReady]);

  useEffect(() => {
    if (!mp?.connected || !isMatchupChannel(channel) || !sessionReady) return;
    mp.sendMatchupSubscribe(channel);
  }, [channel, mp, sessionReady, mp?.connected]);

  useEffect(() => {
    if (!isMatchupChannel(channel)) return;
    if (payload) return;

    const durMs = localCountdownMs(channel);
    if (durMs <= 0) return;
    endsAtRef.current = syncedNow() + durMs;
    setMsUntilNext(durMs);
  }, [channel, payload]);

  useEffect(() => {
    if (!isMatchupChannel(channel)) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const endsAt = endsAtRef.current;
      if (endsAt == null) {
        const durMs = localCountdownMs(channel);
        if (durMs > 0) {
          endsAtRef.current = syncedNow() + durMs;
          setMsUntilNext(durMs);
        }
        return;
      }
      setMsUntilNext(Math.max(0, endsAt - syncedNow()));
    };

    timer = setInterval(tick, 1000);
    const unsub = subscribeStageSync(tick);
    return () => {
      if (timer) clearInterval(timer);
      unsub();
    };
  }, [channel, mp, payload]);

  useEffect(() => {
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
    if (!payload) {
      setSwapPendingLive(false);
      return;
    }
    if (payload.swapPending) {
      swapTimerRef.current = setTimeout(() => setSwapPendingLive(true), BADGE_DEBOUNCE_MS);
    } else {
      setSwapPendingLive(false);
    }
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, [payload?.swapPending, payload?.channel]);

  const castVote = useCallback((side: 'a' | 'b') => {
    if (!mp || !sessionReady) return;
    const session = getPlayerSession();
    const isSuperAdmin = isSuperAdminFestieName(session.festie?.name);
    if (!isSuperAdmin) {
      setLocalMyVote(side);
      setPayload(prev => (prev ? { ...prev, myVote: side } : prev));
    }
    mp.sendMatchupVote(channel, side);
  }, [channel, mp, sessionReady]);

  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => subscribeStageSync(() => setSyncTick(t => t + 1)), []);

  const localPreview = useMemo(() => {
    if (!isMatchupChannel(channel)) return null;
    return localMatchupVotePreview(channel, getStageSync());
  }, [channel, syncTick]);

  const effectiveVoteA = payload?.voteA ?? localPreview?.voteA;
  const effectiveVoteB = payload?.voteB ?? localPreview?.voteB ?? null;
  const myVote = payload?.myVote ?? localMyVote;

  const toVideo = (track: MatchupStatePayload['voteA'] | null | undefined): StageVideo | null => {
    if (!track?.youtubeId) return null;
    const cfg = matchupConfigFor(channel, getStageSync());
    for (const bucket of cfg?.streamers ?? []) {
      const stored = bucket.videos.find(v => v.id === track.youtubeId);
      if (stored) {
        const bucketChannelUrl = bucket.videos.find(v => v.channelUrl)?.channelUrl;
        return {
          ...stored,
          title: track.title || stored.title,
          durationSec: track.durationSec ?? stored.durationSec,
          channelTitle: stored.channelTitle ?? bucket.name,
          ...(bucketChannelUrl && !stored.channelUrl ? { channelUrl: bucketChannelUrl } : {}),
        };
      }
    }
    return {
      id: track.youtubeId,
      title: track.title,
      durationSec: track.durationSec,
    };
  };

  const holderVideo = toVideo(effectiveVoteA);
  const challengerVideo = toVideo(effectiveVoteB);

  const videoIds = useMemo(() => {
    const ids: string[] = [];
    if (holderVideo?.id) ids.push(holderVideo.id);
    if (challengerVideo?.id) ids.push(challengerVideo.id);
    return ids;
  }, [holderVideo?.id, challengerVideo?.id]);

  const videoMeta = useStageVideoMeta(videoIds);

  const holderDisplay = holderVideo
    ? lineupDisplayForVideo(holderVideo, videoMeta.get(holderVideo.id))
    : null;
  const challengerDisplay = challengerVideo
    ? lineupDisplayForVideo(challengerVideo, videoMeta.get(challengerVideo.id))
    : null;

  const { pctA, pctB, needlePct } = matchupDisplayPercents(
    shareSynced ? payload?.shareB : 0.5,
  );

  return {
    payload,
    holderDisplay,
    challengerDisplay,
    pctA,
    pctB,
    needlePct,
    msUntilNext,
    swapPendingLive,
    castVote,
    myVote,
    isSuperAdmin: isSuperAdminFestieName(getPlayerSession().festie?.name),
    connected: mp?.connected ?? false,
    sessionReady,
    canVote: Boolean(mp && sessionReady),
    playerId: getOrCreatePlayerId(),
    refresh: () => mp?.sendMatchupSubscribe(channel),
  };
}
