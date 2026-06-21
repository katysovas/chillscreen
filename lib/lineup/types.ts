import type { StageChannel, StageVideo } from '@/lib/stageVideos';

export type StoredLineupSuggestion = {
  video: StageVideo;
  addedAt: number;
};

export type LineupVoteCounts = Record<string, number>;

export type LineupChannelState = {
  /** voterId → videoId */
  votes: Record<string, string>;
  suggestions: StoredLineupSuggestion[];
};

export type LineupStatePayload = {
  channel: StageChannel;
  myVote?: string | null;
  counts: LineupVoteCounts;
  suggestions: StoredLineupSuggestion[];
};

export function lineupCountsFromVotes(votes: Record<string, string>): LineupVoteCounts {
  const counts: LineupVoteCounts = {};
  for (const videoId of Object.values(votes)) {
    if (!videoId) continue;
    counts[videoId] = (counts[videoId] ?? 0) + 1;
  }
  return counts;
}

export function emptyLineupChannelState(): LineupChannelState {
  return { votes: {}, suggestions: [] };
}
