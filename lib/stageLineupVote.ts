import type { StageChannel } from './stageVideos';

const STORAGE_PREFIX = 'stage-lineup-vote:';

/** Fake bump added to the voted row's progress bar. */
export const LINEUP_VOTE_BUMP_PCT = 18;

export function lineupVoteStorageKey(channel: StageChannel): string {
  return `${STORAGE_PREFIX}${channel}`;
}

export function readLineupVote(channel: StageChannel): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(lineupVoteStorageKey(channel))?.trim();
    return raw || null;
  } catch {
    return null;
  }
}

export function writeLineupVote(channel: StageChannel, videoId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(lineupVoteStorageKey(channel), videoId);
  } catch {
    /* storage blocked */
  }
}

export function lineupProgressWithVoteBump(progressPct: number, voted: boolean): number {
  if (!voted) return progressPct;
  return Math.min(100, progressPct + LINEUP_VOTE_BUMP_PCT);
}
