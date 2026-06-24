import { isMatchupChannel } from '@/lib/matchup/config';
import { scheduleFor, type StageChannel, type StageSync } from '@/lib/stageVideos';

/** Wall time when the current rotation slot ends (next announce boundary). */
export function nextRotationBoundaryMs(
  channel: StageChannel,
  now: number,
  sync: StageSync,
): number | null {
  if (isMatchupChannel(channel)) return null;
  const sched = scheduleFor(channel, now, sync);
  if (!sched) return null;
  return now + sched.msUntilNext;
}
