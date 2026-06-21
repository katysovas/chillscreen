/** UI helpers for lineup vote display — persistence is PartyKit + DB. */

/** Small personal bump when you voted for a row. */
export const LINEUP_VOTE_OWN_BUMP_PCT = 3;

export type LineupVoteState = {
  myVote: string | null;
  counts: Record<string, number>;
};

export const EMPTY_LINEUP_VOTE_STATE: LineupVoteState = {
  myVote: null,
  counts: {},
};

/**
 * Subtle progress boost from real vote counts — sqrt scaling so a few votes
 * look like modest crowd momentum without jumping to 100%.
 */
export function lineupProgressWithVoteBump(
  progressPct: number,
  voted: boolean,
  voteCount = 0,
): number {
  const crowdBoost = voteCount > 0
    ? Math.min(22, 4 + Math.sqrt(voteCount) * 5)
    : 0;
  const ownBoost = voted ? LINEUP_VOTE_OWN_BUMP_PCT : 0;
  return Math.min(100, progressPct + crowdBoost + ownBoost);
}

export function topVotedVideoId(
  counts: Record<string, number>,
  eligibleIds: Iterable<string>,
): string | null {
  const eligible = new Set(eligibleIds);
  let bestId: string | null = null;
  let bestCount = 0;
  for (const id of eligible) {
    const count = counts[id] ?? 0;
    if (count > bestCount) {
      bestCount = count;
      bestId = id;
    }
  }
  return bestId;
}
