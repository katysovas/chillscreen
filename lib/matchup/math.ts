import { BASELINE, HALF_LIFE_MS, SWAP_THRESHOLD } from './constants';
import type { MatchupVote, RoomState } from './types';

export function voteWeight(vote: MatchupVote, now: number): number {
  return Math.exp(-(now - vote.ts) / HALF_LIFE_MS);
}

export function shareBFromVotes(votes: Record<string, MatchupVote>, now: number): number {
  let wa = 0;
  let wb = 0;
  for (const vote of Object.values(votes)) {
    if (vote.side !== 'a' && vote.side !== 'b') continue;
    const w = voteWeight(vote, now);
    if (vote.side === 'a') wa += w;
    else wb += w;
  }
  return (wb + BASELINE / 2) / (wa + wb + BASELINE);
}

export function shareB(state: RoomState, now: number): number {
  return shareBFromVotes(state.votes, now);
}

export function swapPendingAt(state: RoomState, now: number): boolean {
  return state.challenger != null && shareB(state, now) > SWAP_THRESHOLD;
}
