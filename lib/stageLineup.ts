import {
  mergeStagePlaylists,
  scheduleFor,
  type StageChannel,
  type StageSync,
  type StageVideo,
} from './stageVideos';
import { resolveStageVideoDisplayMeta, type StageVideoDisplayMeta } from './stageVideoMeta';
import { formatFollowerCount } from './youtubeApi';
import { topVotedVideoId } from './stageLineupVote';

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

/** Now playing + next on-deck slots (excluding now). */
export const LINEUP_ON_DECK_WAITING = 4;

export type StageLineup = {
  now: StageLineupNowPlaying;
  /** Next scheduled slots after now (up to LINEUP_ON_DECK_WAITING). */
  waiting: StageLineupSlot[];
  /** Scheduled playlist entries beyond the on-deck window. */
  moreWaitingCount: number;
};

export type LineupWaitingEntry = StageLineupSlot & {
  /** User-submitted — not in the synced playlist. */
  custom?: boolean;
};

export function lineupSlotAtOffset(
  list: StageVideo[],
  schedIndex: number,
  offset: number,
): StageLineupSlot {
  const index = (schedIndex + offset) % list.length;
  return { video: list[index]!, index };
}

export function lineupHiddenScheduledSlots(
  list: StageVideo[],
  schedIndex: number,
): StageLineupSlot[] {
  if (list.length <= LINEUP_VISIBLE_COUNT) return [];
  const slots: StageLineupSlot[] = [];
  for (let offset = LINEUP_VISIBLE_COUNT; offset < list.length; offset++) {
    slots.push(lineupSlotAtOffset(list, schedIndex, offset));
  }
  return slots;
}

export function buildLineupWaitingPool(
  list: StageVideo[],
  schedIndex: number,
  scheduledFifth: StageLineupSlot | null,
  customVideos: StageVideo[],
): LineupWaitingEntry[] {
  const pool: LineupWaitingEntry[] = [];
  const seen = new Set<string>();

  const push = (slot: StageLineupSlot, custom = false) => {
    if (seen.has(slot.video.id)) return;
    seen.add(slot.video.id);
    pool.push({ ...slot, custom });
  };

  for (const slot of lineupHiddenScheduledSlots(list, schedIndex)) {
    push(slot);
  }
  if (scheduledFifth) push(scheduledFifth);
  for (const video of customVideos) {
    push({ video, index: -1 }, true);
  }
  return pool;
}

export function sortLineupSlotsByVotes(
  slots: StageLineupSlot[],
  voteCounts: Record<string, number>,
): StageLineupSlot[] {
  return [...slots]
    .map((slot, order) => ({ slot, order }))
    .sort((a, b) => {
      const diff = (voteCounts[b.slot.video.id] ?? 0) - (voteCounts[a.slot.video.id] ?? 0);
      if (diff !== 0) return diff;
      return a.order - b.order;
    })
    .map(({ slot }) => slot);
}

export function sortWaitingPoolByVotes(
  pool: LineupWaitingEntry[],
  voteCounts: Record<string, number>,
): LineupWaitingEntry[] {
  return [...pool]
    .map((entry, order) => ({ entry, order }))
    .sort((a, b) => {
      const diff = (voteCounts[b.entry.video.id] ?? 0) - (voteCounts[a.entry.video.id] ?? 0);
      if (diff !== 0) return diff;
      return a.order - b.order;
    })
    .map(({ entry }) => entry);
}

export function buildLineupDeck(
  lineup: StageLineup,
  waitingPool: LineupWaitingEntry[],
  voteCounts: Record<string, number>,
): {
  onDeckWaiting: StageLineupSlot[];
  fifthSlot: StageLineupSlot | null;
  bumpedScheduledFifth: StageLineupSlot | null;
} {
  const scheduled = lineup.waiting;
  const poolIds = waitingPool.map(entry => entry.video.id);
  const topVoted = topVotedVideoId(voteCounts, poolIds);
  const fromPool = topVoted
    ? waitingPool.find(entry => entry.video.id === topVoted)
    : null;

  if (scheduled.length < LINEUP_ON_DECK_WAITING) {
    const onDeckWaiting = sortLineupSlotsByVotes(scheduled, voteCounts);
    if (fromPool) {
      return {
        onDeckWaiting,
        fifthSlot: { video: fromPool.video, index: fromPool.index },
        bumpedScheduledFifth: null,
      };
    }
    return {
      onDeckWaiting,
      fifthSlot: null,
      bumpedScheduledFifth: null,
    };
  }

  const scheduledFirstThree = sortLineupSlotsByVotes(scheduled.slice(0, 3), voteCounts);
  const scheduledFifth = scheduled[3]!;

  if (fromPool) {
    return {
      onDeckWaiting: scheduledFirstThree,
      fifthSlot: { video: fromPool.video, index: fromPool.index },
      bumpedScheduledFifth: scheduledFifth,
    };
  }

  const onDeckFour = sortLineupSlotsByVotes(scheduled.slice(0, LINEUP_ON_DECK_WAITING), voteCounts);
  return {
    onDeckWaiting: onDeckFour.slice(0, 3),
    fifthSlot: onDeckFour[3] ?? scheduledFifth,
    bumpedScheduledFifth: null,
  };
}

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

  const maxWaiting = Math.min(LINEUP_ON_DECK_WAITING, Math.max(0, list.length - 1));
  const waiting: StageLineupSlot[] = [];
  for (let offset = 1; offset <= maxWaiting; offset++) {
    waiting.push(lineupSlotAtOffset(list, sched.index, offset));
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
): { name: string; subtitle: string; followersLabel: string; avatarUrl: string; avatarLetter: string; channelUrl?: string; channelDescription?: string } {
  const meta = resolveStageVideoDisplayMeta(video, fetched);
  const followersLabel = meta.subscriberCount
    ? formatFollowerCount(meta.subscriberCount)
    : '';
  const channelDescription = meta.channelDescription
    ? lineupTitleLabel(meta.channelDescription, 160)
    : undefined;
  return {
    name: lineupTitleLabel(meta.channelTitle, 28),
    subtitle: lineupTitleLabel(meta.videoTitle, 42),
    followersLabel,
    avatarUrl: meta.avatarUrl,
    avatarLetter: lineupAvatarLetter(meta.channelTitle),
    channelUrl: meta.channelUrl,
    channelDescription,
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

export function lineupWaitingPoolCount(
  listLength: number,
  customCount: number,
  bumpedScheduledFifth: boolean,
): number {
  const hiddenScheduled = listLength > LINEUP_VISIBLE_COUNT
    ? listLength - LINEUP_VISIBLE_COUNT
    : 0;
  return hiddenScheduled + customCount + (bumpedScheduledFifth ? 1 : 0);
}

export function lineupAvatarColors(index: number): { bg: string; fg: string } {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length]!;
}
