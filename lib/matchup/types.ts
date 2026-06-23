import type { StageChannel } from '@/lib/stageVideos';

export type VoteSide = 'a' | 'b';

/** One vote per account — re-tap refreshes ts. */
export type MatchupVote = { side: VoteSide; ts: number };

export type MatchupTrack = {
  youtubeId: string;
  title: string;
  durationSec?: number;
};

export type CreatorLineup = {
  creatorId: string;
  tracks: MatchupTrack[];
};

export type MatchupCurrentTrack = {
  track: MatchupTrack;
  startedAt: number;
  endsAt: number;
};

/** Room = stage. References creator lineups, never embeds tracks. */
export type RoomState = {
  stageId: StageChannel;
  holder: string;
  challenger: string | null;
  queue: string[];
  current: MatchupCurrentTrack;
  votes: Record<string, MatchupVote>;
  /** Vote strip side A — now playing (holder track). */
  voteA: MatchupTrack;
  /** Vote strip side B — challenger's next track in rotation. */
  voteB: MatchupTrack | null;
  /** Per-streamer rotation cursor (next index to play). */
  cursors: Record<string, number>;
  /** @deprecated unused — kept for stored room migration */
  recentlyPlayed?: string[];
  /** @deprecated unused — kept for stored room migration */
  seed?: number;
  lastResolvedAt: number;
};

export type MatchupStatePayload = {
  channel: StageChannel;
  holder: string;
  challenger: string | null;
  myVote?: VoteSide | null;
  /** Challenger share 0–1 (includes phantom baseline). */
  shareB: number;
  swapPending: boolean;
  current: MatchupCurrentTrack;
  /** Vote strip side A — now playing. */
  voteA: MatchupTrack;
  /** Vote strip side B — challenger's next track in rotation. */
  voteB: MatchupTrack | null;
  msUntilNext: number;
};
