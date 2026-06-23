import type { StageChannel, StageSync } from '@/lib/stageVideos';
import { SWAP_THRESHOLD } from './constants';
import { shareB } from './math';
import {
  fallbackChallenger,
  initialMatchupRoster,
} from './playlists';
import {
  pickChallengerPreview,
  pickNext,
  pickRotating,
  lineupTracksForStreamer,
  trackDurationMs,
} from './lineups';
import type { RoomState } from './types';

export function createInitialRoomState(
  channel: StageChannel,
  sync: StageSync,
  now: number,
): RoomState {
  const { holder, challenger, queue } = initialMatchupRoster(channel, sync);
  const holderTracks = lineupTracksForStreamer(holder, channel, sync);
  const { track, nextCursor } = pickRotating(
    holderTracks,
    0,
    sync.defaultDurationMs / 1000,
  );
  const cursors: Record<string, number> = { [holder]: nextCursor };
  const durMs = trackDurationMs(track, sync.defaultDurationMs);
  const startedAt = now;
  const base = { stageId: channel, cursors };

  return {
    stageId: channel,
    holder,
    challenger,
    queue,
    votes: {},
    voteA: track,
    voteB: challenger
      ? pickChallengerPreview(base, challenger, sync)
      : null,
    cursors,
    lastResolvedAt: now,
    current: {
      track,
      startedAt,
      endsAt: startedAt + durMs,
    },
  };
}

export function resolveAt(state: RoomState, now: number, sync: StageSync): RoomState {
  const next: RoomState = structuredClone(state);

  while (now >= next.current.endsAt) {
    const boundary = next.current.endsAt;

    if (next.challenger != null && shareB(next, boundary) > SWAP_THRESHOLD) {
      const loser = next.holder;
      next.holder = next.challenger;
      next.challenger = next.queue.shift() ?? fallbackChallenger(next, sync);
      next.queue.push(loser);
    }

    next.votes = {};

    const picked = pickNext(next, next.holder, sync);
    next.cursors = picked.cursors;
    const track = picked.track;
    const durMs = trackDurationMs(track, sync.defaultDurationMs);
    next.current = {
      track,
      startedAt: boundary,
      endsAt: boundary + durMs,
    };
    next.voteA = track;
    next.voteB = next.challenger
      ? pickChallengerPreview(next, next.challenger, sync)
      : null;
  }

  next.lastResolvedAt = now;
  return next;
}
