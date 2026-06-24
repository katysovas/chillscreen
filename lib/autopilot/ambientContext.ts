import { currentSchedule } from '@/lib/stageClock';
import { nowPlayingStream } from '@/lib/stages/runtime';
import type { UserStagePublic } from '@/lib/stages/types';
import type { StageChannel } from '@/lib/stageVideos';

export type AutopilotAmbientContext = {
  nowPlaying: string | null;
  stageName: string | null;
  humanCount: number;
  /** Random real player on stage — for name-drops. */
  humanName: string | null;
};

type BuildAutopilotAmbientContextInput = {
  stageName: string | null;
  creatorStage: UserStagePublic | null;
  stagePlaybackChannel: StageChannel | null;
  cinemaNowPlaying: string | null;
  concertNowPlaying: string | null;
  remotePlayers: Iterable<{ name: string | null }>;
};

export function shortNowPlayingTitle(title: string): string {
  let t = title.trim();
  if (!t) return 'this set';
  const dashSplit = t.split(/\s[—–-]\s+/);
  if (dashSplit[0] && dashSplit[0].length >= 3 && dashSplit[0].length < t.length) {
    t = dashSplit[0].trim();
  }
  t = t.replace(/\s*(full\s*(set|concert|show|performance)|live\s*@.*|@.*)$/i, '').trim();
  if (t.length > 22) t = `${t.slice(0, 20).trimEnd()}…`;
  return t;
}

function pickHumanName(players: Iterable<{ name: string | null }>): string | null {
  const names = [...players]
    .map(p => p.name?.trim())
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return null;
  return names[Math.floor(Math.random() * names.length)]!;
}

function resolveNowPlaying(input: BuildAutopilotAmbientContextInput): string | null {
  if (input.creatorStage) {
    const title = nowPlayingStream(input.creatorStage)?.title?.trim();
    return title ? shortNowPlayingTitle(title) : null;
  }
  const cinema = input.cinemaNowPlaying?.trim();
  if (cinema) return shortNowPlayingTitle(cinema);
  const concert = input.concertNowPlaying?.trim();
  if (concert) return shortNowPlayingTitle(concert);
  if (input.stagePlaybackChannel) {
    const title = currentSchedule(input.stagePlaybackChannel)?.video.title?.trim();
    return title ? shortNowPlayingTitle(title) : null;
  }
  return null;
}

export function buildAutopilotAmbientContext(
  input: BuildAutopilotAmbientContextInput,
): AutopilotAmbientContext {
  const remotePlayers = [...input.remotePlayers];
  return {
    nowPlaying: resolveNowPlaying(input),
    stageName: input.stageName?.trim() || null,
    humanCount: remotePlayers.length,
    humanName: pickHumanName(remotePlayers),
  };
}
