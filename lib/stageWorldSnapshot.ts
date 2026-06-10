import { currentSchedule } from '@/lib/stageClock';
import type { StageChannel } from '@/lib/stageVideos';

export type StageWorldEntry = {
  channel: StageChannel;
  stageName: string;
  city: string;
  nowPlaying: string | null;
};

const STAGE_META: { channel: StageChannel; stageName: string; city: string }[] = [
  { channel: 'cinema', stageName: 'Chill Cinema', city: 'San Francisco' },
  { channel: 'outside-lands', stageName: 'San Francisco Stage', city: 'San Francisco' },
  { channel: 'edc', stageName: 'Vegas Stage', city: 'Las Vegas' },
  { channel: 'coachella', stageName: 'The Desert Stage', city: 'Southern California' },
  { channel: 'which-stage', stageName: 'The Farm', city: 'The Farm' },
  { channel: 'forest', stageName: 'The Forest Stage', city: 'The Forest' },
  { channel: 'silent-disco', stageName: 'Silent Disco', city: 'Silent Disco' },
  { channel: 'bumbershoot', stageName: 'Seattle Stage', city: 'Seattle' },
];

/** What's on every stage channel right now (sync clock — not viewport-dependent). */
export function getStageWorldSnapshot(): { stages: StageWorldEntry[] } {
  return {
    stages: STAGE_META.map(({ channel, stageName, city }) => {
      const sched = currentSchedule(channel);
      const title = sched?.video.title?.trim() || null;
      return { channel, stageName, city, nowPlaying: title };
    }),
  };
}

/** One-line summary for LLM / template prompts. */
export function formatStageWorldNote(snapshot: { stages: StageWorldEntry[] }): string {
  const lines = snapshot.stages.map(s => {
    if (s.nowPlaying) {
      return `${s.stageName} (${s.city}): "${s.nowPlaying}"`;
    }
    return `${s.stageName} (${s.city}): between sets / quiet`;
  });
  return lines.join('\n');
}
