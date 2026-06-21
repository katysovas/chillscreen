'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Multiplayer } from '@/lib/multiplayer/useMultiplayer';
import type { LineupStatePayload } from '@/lib/multiplayer/protocol';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import type { StoredLineupSuggestion } from '@/lib/lineup/types';
import { EMPTY_LINEUP_VOTE_STATE, type LineupVoteState } from '@/lib/stageLineupVote';
import {
  getOrCreatePlayerId,
  isPlayerSessionReady,
  subscribePlayerSession,
} from '@/lib/player/session';

type LineupMultiplayer = Pick<
  Multiplayer,
  | 'connected'
  | 'requestConnect'
  | 'sendLineupSubscribe'
  | 'sendLineupVote'
  | 'sendLineupSuggest'
  | 'registerLineupStateHandler'
>;

export function useStageLineupVotes(
  channel: StageChannel,
  mp: LineupMultiplayer | null,
) {
  const [voteState, setVoteState] = useState<LineupVoteState>(EMPTY_LINEUP_VOTE_STATE);
  const [suggestions, setSuggestions] = useState<StoredLineupSuggestion[]>([]);
  const [sessionReady, setSessionReady] = useState(isPlayerSessionReady);

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
    if (!mp) return;
    mp.requestConnect();
  }, [mp]);

  useEffect(() => {
    if (!mp) {
      setVoteState(EMPTY_LINEUP_VOTE_STATE);
      setSuggestions([]);
      return;
    }

    const onState = (msg: LineupStatePayload) => {
      if (msg.channel !== channel) return;
      setVoteState(prev => ({
        myVote: msg.myVote !== undefined ? (msg.myVote ?? null) : prev.myVote,
        counts: msg.counts,
      }));
      setSuggestions(msg.suggestions);
    };

    mp.registerLineupStateHandler(onState);
    if (sessionReady) {
      mp.sendLineupSubscribe(channel);
    }
    return () => mp.registerLineupStateHandler(null);
  }, [channel, mp, sessionReady]);

  const castVote = useCallback((videoId: string) => {
    if (!mp || !sessionReady || voteState.myVote) return;
    setVoteState(prev => ({ ...prev, myVote: videoId }));
    mp.sendLineupVote(channel, videoId);
  }, [channel, mp, sessionReady, voteState.myVote]);

  const appendSuggestion = useCallback((video: StageVideo) => {
    if (!mp) return;
    mp.sendLineupSuggest(channel, video);
  }, [channel, mp]);

  const voteLocked = voteState.myVote != null;

  return {
    voteState,
    suggestions,
    castVote,
    appendSuggestion,
    connected: mp?.connected ?? false,
    sessionReady,
    voteLocked,
    playerId: getOrCreatePlayerId(),
  };
}
