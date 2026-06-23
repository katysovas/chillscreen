import type { StageChannel, StageSync, StageVideo } from '@/lib/stageVideos';
import type { MatchupTrack, RoomState } from './types';
import { isMatchupChannel } from './config';
import { normalizeMatchupConfig } from './normalize';
import type { MatchupStageConfig, MatchupStreamerBucket } from './normalize';

export type { MatchupStageConfig, MatchupStreamerBucket } from './normalize';
export { normalizeMatchupConfig } from './normalize';

const KOTH_PREFIX = 'koth:';

function toTrack(video: StageVideo): MatchupTrack {
  return {
    youtubeId: video.id,
    title: video.title,
    durationSec: video.durationSec,
  };
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'streamer';
}


export function matchupConfigFor(
  channel: StageChannel,
  sync: StageSync,
): MatchupStageConfig | null {
  if (!isMatchupChannel(channel)) return null;
  const raw = sync.matchup?.[channel];
  return raw ? normalizeMatchupConfig(raw) ?? raw : null;
}

export function matchupStreamerId(channel: StageChannel, streamerKey: string): string {
  return `${KOTH_PREFIX}${channel}:${streamerKey}`;
}

export function parseMatchupStreamerKey(streamerId: string): string | null {
  if (!streamerId.startsWith(KOTH_PREFIX)) return null;
  const rest = streamerId.slice(KOTH_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon < 0) return null;
  return rest.slice(colon + 1) || null;
}

export function listMatchupStreamerIds(
  channel: StageChannel,
  sync: StageSync,
): string[] {
  const cfg = matchupConfigFor(channel, sync);
  if (!cfg) return [];
  return cfg.streamers
    .filter(s => s.videos.length > 0)
    .map(s => matchupStreamerId(channel, s.id));
}

export function streamerBucket(
  channel: StageChannel,
  streamerId: string,
  sync: StageSync,
): MatchupStreamerBucket | null {
  const cfg = matchupConfigFor(channel, sync);
  if (!cfg) return null;
  const key = parseMatchupStreamerKey(streamerId);
  if (!key) return null;
  return cfg.streamers.find(s => s.id === key) ?? null;
}

export function lineupTracksForStreamer(
  streamerId: string,
  channel: StageChannel,
  sync: StageSync,
): MatchupTrack[] {
  const bucket = streamerBucket(channel, streamerId, sync);
  if (bucket?.videos.length) return bucket.videos.map(toTrack);
  return legacySplitLineup(streamerId, channel, sync);
}

/** Fallback when matchup buckets are missing — first/second half of stage playlist. */
function legacySplitLineup(
  streamerId: string,
  channel: StageChannel,
  sync: StageSync,
): MatchupTrack[] {
  const all = (sync.playlists[channel] ?? []).map(toTrack);
  if (!all.length) return [];
  const key = parseMatchupStreamerKey(streamerId);
  const mid = Math.max(1, Math.ceil(all.length / 2));
  if (key === 'b' || key === 'challenger') return all.slice(mid);
  return all.slice(0, mid);
}

export function normalizeMatchupStreamerId(
  channel: StageChannel,
  streamerId: string,
  sync: StageSync,
): string {
  const key = parseMatchupStreamerKey(streamerId);
  if (!key) return streamerId;

  const cfg = matchupConfigFor(channel, sync);
  if (cfg?.streamers.some(s => s.id === key)) {
    return matchupStreamerId(channel, key);
  }

  const legacyMap: Record<string, string> = {
    holder: 'a',
    challenger: 'b',
  };
  const mapped = legacyMap[key] ?? key;
  const bucket = cfg?.streamers.find(s => s.id === mapped);
  if (bucket) return matchupStreamerId(channel, bucket.id);

  const roster = listMatchupStreamerIds(channel, sync);
  if (key === 'a' || key === 'holder') return roster[0] ?? matchupStreamerId(channel, 'a');
  if (key === 'b' || key === 'challenger') return roster[1] ?? roster[0] ?? matchupStreamerId(channel, 'b');
  return roster[0] ?? streamerId;
}

export function initialMatchupRoster(
  channel: StageChannel,
  sync: StageSync,
): { holder: string; challenger: string | null; queue: string[] } {
  const roster = listMatchupStreamerIds(channel, sync);
  return {
    holder: roster[0] ?? matchupStreamerId(channel, 'a'),
    challenger: roster[1] ?? null,
    queue: roster.slice(2),
  };
}

/** Ensure holder/challenger/queue match the configured streamer roster. */
export function repairMatchupRoster(state: RoomState, sync: StageSync): RoomState {
  const roster = listMatchupStreamerIds(state.stageId, sync);
  if (roster.length < 2) return state;

  let holder = roster.includes(state.holder) ? state.holder : roster[0]!;
  let challenger = state.challenger
    && roster.includes(state.challenger)
    && state.challenger !== holder
    ? state.challenger
    : roster.find(id => id !== holder) ?? null;

  const active = new Set([holder, challenger].filter(Boolean) as string[]);
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const id of state.queue) {
    if (!roster.includes(id) || active.has(id) || seen.has(id)) continue;
    seen.add(id);
    queue.push(id);
  }
  for (const id of roster) {
    if (active.has(id) || seen.has(id)) continue;
    seen.add(id);
    queue.push(id);
  }

  return { ...state, holder, challenger, queue };
}

export function localMatchupVotePreview(
  channel: StageChannel,
  sync: StageSync,
): { voteA: MatchupTrack; voteB: MatchupTrack | null } | null {
  const { holder, challenger } = initialMatchupRoster(channel, sync);
  const voteA = previewAtCursor(lineupTracksForStreamer(holder, channel, sync), 0);
  if (!voteA?.youtubeId) return null;
  const voteB = challenger
    ? previewAtCursor(lineupTracksForStreamer(challenger, channel, sync), 0)
    : null;
  return { voteA, voteB };
}

export function fallbackChallenger(
  state: RoomState,
  sync: StageSync,
): string | null {
  const roster = listMatchupStreamerIds(state.stageId, sync);
  if (roster.length < 2) return null;
  const holderIdx = roster.indexOf(state.holder);
  const start = holderIdx >= 0 ? holderIdx + 1 : 0;
  for (let i = 0; i < roster.length; i++) {
    const candidate = roster[(start + i) % roster.length]!;
    if (candidate !== state.holder) return candidate;
  }
  return null;
}

export function bucketAdminLabel(bucket: MatchupStreamerBucket): string {
  if (bucket.name?.trim()) return bucket.name.trim();
  const channelTitle = bucket.videos.find(v => v.channelTitle?.trim())?.channelTitle?.trim();
  if (channelTitle) return channelTitle;
  return bucket.id;
}

export function pickRotating(
  tracks: MatchupTrack[],
  cursor: number,
  fallbackDurationSec: number,
): { track: MatchupTrack; nextCursor: number } {
  if (!tracks.length) {
    return {
      track: { youtubeId: '', title: '…', durationSec: fallbackDurationSec },
      nextCursor: 0,
    };
  }
  const idx = cursor % tracks.length;
  return { track: tracks[idx]!, nextCursor: cursor + 1 };
}

export function previewAtCursor(
  tracks: MatchupTrack[],
  cursor: number,
): MatchupTrack | null {
  if (!tracks.length) return null;
  return tracks[cursor % tracks.length]!;
}

export function defaultMatchupFromPlaylist(
  videos: StageVideo[],
): MatchupStageConfig {
  const mid = Math.max(1, Math.ceil(videos.length / 2));
  return {
    streamers: [
      { id: 'a', videos: videos.slice(0, mid) },
      { id: 'b', videos: videos.slice(mid) },
    ],
  };
}

export function newStreamerBucket(
  existing: MatchupStreamerBucket[],
  opts?: { name?: string },
): MatchupStreamerBucket {
  let n = existing.length + 1;
  let id = `streamer-${n}`;
  const taken = new Set(existing.map(s => s.id));
  while (taken.has(id)) {
    n += 1;
    id = `streamer-${n}`;
  }
  const name = opts?.name?.trim();
  return {
    id: slugify(name ?? id),
    ...(name ? { name } : {}),
    videos: [],
  };
}
