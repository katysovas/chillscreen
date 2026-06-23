import type { StageChannel } from '@/lib/stageVideos';

/** Stages running king-of-the-hill swap voting. */
export const MATCHUP_CHANNELS = new Set<StageChannel>(['deep-space']);

export function isMatchupChannel(channel: StageChannel): boolean {
  return MATCHUP_CHANNELS.has(channel);
}
