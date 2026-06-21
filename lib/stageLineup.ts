import {
  mergeStagePlaylists,
  scheduleFor,
  type StageChannel,
  type StageSync,
  type StageVideo,
} from './stageVideos';
import { resolveStageVideoDisplayMeta, type StageVideoDisplayMeta } from './stageVideoMeta';

export type StageLineupSlot = {
  video: StageVideo;
  index: number;
};

export type StageLineupNowPlaying = StageLineupSlot & {
  offsetSec: number;
  msUntilNext: number;
  slotDurationMs: number;
};

/** Now playing + next slots shown in the lineup panel. */
export const LINEUP_VISIBLE_COUNT = 5;

export type StageLineup = {
  now: StageLineupNowPlaying;
  /** Upcoming slots after now (at most LINEUP_VISIBLE_COUNT - 1). */
  waiting: StageLineupSlot[];
  /** Playlist entries beyond the visible window. */
  moreWaitingCount: number;
};

export function stageLineupFor(
  channel: StageChannel,
  now: number,
  sync: StageSync,
): StageLineup | null {
  const sched = scheduleFor(channel, now, sync);
  if (!sched) return null;

  const list = mergeStagePlaylists(sync.playlists)[channel];
  if (!list.length) return null;

  const slotDurationMs = sched.video.durationSec
    ? sched.video.durationSec * 1000
    : sync.defaultDurationMs;

  const maxWaiting = Math.min(LINEUP_VISIBLE_COUNT - 1, Math.max(0, list.length - 1));
  const waiting: StageLineupSlot[] = [];
  for (let offset = 1; offset <= maxWaiting; offset++) {
    const index = (sched.index + offset) % list.length;
    waiting.push({ video: list[index]!, index });
  }

  return {
    now: {
      video: sched.video,
      index: sched.index,
      offsetSec: sched.offsetSec,
      msUntilNext: sched.msUntilNext,
      slotDurationMs,
    },
    waiting,
    moreWaitingCount: Math.max(0, list.length - LINEUP_VISIBLE_COUNT),
  };
}

export function lineupQueueProgressPct(queueIndex: number, nextProgress: number): number {
  if (queueIndex === 0) return nextProgress;
  const fallback = [80, 55, 34, 20];
  return fallback[queueIndex - 1] ?? 20;
}

export function lineupWaitingSubtitle(queueIndex: number, msUntilNext: number): string | null {
  if (queueIndex === 0) {
    return `up next · starts in ${formatLineupCountdown(msUntilNext)}`;
  }
  return null;
}

export function formatLineupCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function lineupProgressPct(elapsedMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
}

export function lineupAvatarLetter(title: string): string {
  const match = title.trim().match(/[a-z0-9]/i);
  return (match?.[0] ?? '?').toLowerCase();
}

export function lineupDisplayForVideo(
  video: StageVideo,
  fetched?: StageVideoDisplayMeta,
): { name: string; subtitle: string; avatarUrl: string; avatarLetter: string; channelUrl?: string } {
  const meta = resolveStageVideoDisplayMeta(video, fetched);
  return {
    name: lineupTitleLabel(meta.channelTitle, 28),
    subtitle: lineupTitleLabel(meta.videoTitle, 42),
    avatarUrl: meta.avatarUrl,
    avatarLetter: lineupAvatarLetter(meta.channelTitle),
    channelUrl: meta.channelUrl,
  };
}

export function lineupTitleLabel(title: string, maxLen = 34): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}

const AVATAR_PALETTE = [
  { bg: '#CECBF6', fg: '#3C3489' },
  { bg: '#9FE1CB', fg: '#085041' },
  { bg: '#F4C0D1', fg: '#72243E' },
  { bg: '#FAC775', fg: '#633806' },
  { bg: '#D3D1C7', fg: '#444441' },
] as const;

export function lineupAvatarColors(index: number): { bg: string; fg: string } {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length]!;
}
