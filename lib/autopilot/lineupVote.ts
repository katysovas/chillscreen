import { syncedNow, getStageSync } from '@/lib/stageClock';
import { stageLineupFor, type StageLineup } from '@/lib/stageLineup';
import type { StageChannel } from '@/lib/stageVideos';

export function lineupVoteOptions(channel: StageChannel): { videoId: string; title: string }[] {
  const lineup: StageLineup | null = stageLineupFor(channel, syncedNow(), getStageSync());
  if (!lineup) return [];
  return lineup.waiting.map(slot => ({
    videoId: slot.video.id,
    title: slot.video.title?.trim() || 'next track',
  }));
}

export function pickAutopilotLineupVote(
  channel: StageChannel,
  alreadyVotedId: string | null,
): { videoId: string; title: string } | null {
  const options = lineupVoteOptions(channel).filter(o => o.videoId !== alreadyVotedId);
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)]!;
}
