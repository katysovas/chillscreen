/**
 * Predefined, server-pinned video playlists for every venue ("stage channel").
 *
 * Channel config is edited via `data/stage-playlists.json` (use the localhost
 * admin at `/admin/stage-playlists` to search YouTube and curate lists).
 *
 * Synchronized playback is purely deterministic: every client derives the same
 * "current video + position" from a shared clock + these playlists, so everyone
 * sees the same thing at the same time on loop.
 *
 * Channels use either:
 *   • `source: 'curated'` — hardcoded video IDs in JSON
 *   • `source: 'youtube-api'` — playlist built from a YouTube search query
 *     (resolved server-side via YouTube Data API v3; see resolveStagePlaylists)
 *
 * Each video plays for exactly `durationSec` seconds before the schedule moves
 * to the next one. Set it to the real video length and the rotation aligns
 * naturally. Videos without `durationSec` fall back to `DEFAULT_DURATION_MS`.
 *
 * This module is dependency-free (no React, no DOM, no Next aliases) so it
 * imports cleanly into both the browser bundle and the PartyKit server
 * (esbuild) where it is the authoritative source of truth.
 */

import rawStagePlaylists from '../data/stage-playlists.json';

type StagePlaylistChannelEntry = StageChannelConfig & { label?: string };

const stagePlaylistsFile = rawStagePlaylists as {
  version: 1;
  updatedAt: string;
  channels: Record<StageChannel, StagePlaylistChannelEntry>;
};

export type StageVideo = {
  id: string;
  title: string;
  /**
   * How long this video plays before the schedule advances (seconds).
   * Set this to the real video length so rotation aligns with the clip end.
   * Omit for live streams or when you don't care — falls back to
   * DEFAULT_DURATION_MS (1 hour).
   */
  durationSec?: number;
};

/** One synchronized playback channel per distinct venue/stage. */
export type StageChannel =
  | 'cinema'
  | 'bumbershoot'
  | 'outside-lands'
  | 'coachella'
  | 'edc'
  | 'which-stage';

/** Per-stage playlist rules — matched against video titles (case-insensitive). */
export type StagePlaylistRules = {
  /** Substrings that exclude a video from this stage (e.g. `['pearl jam']`). */
  excludeTitlePatterns?: string[];
};

export type CuratedChannelConfig = StagePlaylistRules & {
  source: 'curated';
  videos: StageVideo[];
};

export type YoutubeApiChannelConfig = StagePlaylistRules & {
  source: 'youtube-api';
  /** YouTube Data API v3 search query. */
  searchQuery: string;
  maxResults?: number;
  /** Used when the API key is missing or the search fails. */
  fallbackVideos?: StageVideo[];
};

export type StageChannelConfig = CuratedChannelConfig | YoutubeApiChannelConfig;

/** Title substrings excluded from every stage playlist. */
export const GLOBAL_EXCLUDE_TITLE_PATTERNS = ['monster'];

/** Merge global + per-stage exclusion patterns. */
export function mergeExcludePatterns(stagePatterns?: string[]): string[] {
  const stage = (stagePatterns ?? []).filter(p => p.trim().length > 0);
  return [...GLOBAL_EXCLUDE_TITLE_PATTERNS, ...stage];
}

function titleMatchesPatterns(title: string, patterns: string[]): boolean {
  const norm = title.toLowerCase();
  return patterns.some(p => norm.includes(p.toLowerCase()));
}

/** True when a title matches global or per-stage exclusion patterns. */
export function isExcludedStageVideo(title: string, stagePatterns?: string[]): boolean {
  const all = mergeExcludePatterns(stagePatterns);
  return all.length > 0 && titleMatchesPatterns(title, all);
}

export function filterStageVideos<T extends { title: string }>(
  videos: T[],
  stagePatterns?: string[],
): T[] {
  const all = mergeExcludePatterns(stagePatterns);
  if (!all.length) return videos;
  return videos.filter(v => !titleMatchesPatterns(v.title, all));
}

function channelConfigFromFile(entry: StagePlaylistChannelEntry): StageChannelConfig {
  const { label: _label, ...cfg } = entry;
  return cfg as StageChannelConfig;
}

/** Loaded from `data/stage-playlists.json` — edit via localhost admin UI. */
export const STAGE_CHANNEL_CONFIG: Record<StageChannel, StageChannelConfig> = {
  cinema: channelConfigFromFile(stagePlaylistsFile.channels.cinema),
  bumbershoot: channelConfigFromFile(stagePlaylistsFile.channels.bumbershoot),
  'outside-lands': channelConfigFromFile(stagePlaylistsFile.channels['outside-lands']),
  coachella: channelConfigFromFile(stagePlaylistsFile.channels.coachella),
  edc: channelConfigFromFile(stagePlaylistsFile.channels.edc),
  'which-stage': channelConfigFromFile(stagePlaylistsFile.channels['which-stage']),
};

function fallbackPlaylist(cfg: StageChannelConfig): StageVideo[] {
  const raw = cfg.source === 'curated' ? cfg.videos : (cfg.fallbackVideos ?? []);
  return filterStageVideos(raw, cfg.excludeTitlePatterns);
}

/**
 * Fallback playlists (curated + API-channel fallbacks). The live resolver
 * replaces `youtube-api` channels when YOUTUBE_API_KEY is available.
 */
export const STAGE_PLAYLISTS: Record<StageChannel, StageVideo[]> = {
  cinema: fallbackPlaylist(STAGE_CHANNEL_CONFIG.cinema),
  bumbershoot: fallbackPlaylist(STAGE_CHANNEL_CONFIG.bumbershoot),
  'outside-lands': fallbackPlaylist(STAGE_CHANNEL_CONFIG['outside-lands']),
  coachella: fallbackPlaylist(STAGE_CHANNEL_CONFIG.coachella),
  edc: fallbackPlaylist(STAGE_CHANNEL_CONFIG.edc),
  'which-stage': fallbackPlaylist(STAGE_CHANNEL_CONFIG['which-stage']),
};

/**
 * Fallback slot length for any video without an explicit `durationSec`.
 * Default is 1 hour — long enough that a live-stream or unknown-length video
 * won't rotate in the middle of something good.
 */
export const DEFAULT_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fixed reference point the rotation schedule counts from. Shared by every
 * client and reconciled against the server clock, so the index + position math
 * lines up for everyone regardless of when they joined.
 */
export const STAGE_EPOCH = Date.UTC(2025, 0, 1);

/** Timing + playlists the server pins and the client schedules against. */
export type StageSync = {
  epoch: number;
  /** Fallback slot length (ms) for videos without `durationSec`. */
  defaultDurationMs: number;
  playlists: Record<StageChannel, StageVideo[]>;
};

/** Fallback used before (or without) a server handshake — works single-player. */
export const DEFAULT_STAGE_SYNC: StageSync = {
  epoch: STAGE_EPOCH,
  defaultDurationMs: DEFAULT_DURATION_MS,
  playlists: STAGE_PLAYLISTS,
};

/** Merge server playlists with local fallbacks so new channels always have videos. */
export function mergeStagePlaylists(
  remote: Partial<Record<StageChannel, StageVideo[]>> | undefined,
): Record<StageChannel, StageVideo[]> {
  return (Object.keys(STAGE_PLAYLISTS) as StageChannel[]).reduce(
    (acc, channel) => {
      const list = remote?.[channel];
      acc[channel] = list?.length ? list : STAGE_PLAYLISTS[channel];
      return acc;
    },
    {} as Record<StageChannel, StageVideo[]>,
  );
}

/** True when a youtube-api channel still has only its hardcoded fallback IDs. */
export function isFallbackOnlyPlaylist(
  channel: StageChannel,
  videos: StageVideo[],
): boolean {
  const cfg = STAGE_CHANNEL_CONFIG[channel];
  if (cfg.source !== 'youtube-api') return false;
  const fallbacks = cfg.fallbackVideos ?? STAGE_PLAYLISTS[channel];
  if (!videos.length) return true;
  if (videos.length > fallbacks.length) return false;
  const fallbackIds = new Set(fallbacks.map(v => v.id));
  return videos.every(v => fallbackIds.has(v.id));
}

/** Prefer API-resolved playlists over PartyKit fallbacks when merging sync sources. */
export function preferResolvedStagePlaylist(
  channel: StageChannel,
  a: StageVideo[],
  b: StageVideo[],
): StageVideo[] {
  const aFallback = isFallbackOnlyPlaylist(channel, a);
  const bFallback = isFallbackOnlyPlaylist(channel, b);
  if (!aFallback && bFallback) return a;
  if (aFallback && !bFallback) return b;
  return b.length >= a.length ? b : a;
}

/** Merge two partial sync payloads, keeping richer youtube-api results per channel. */
export function mergeStageSyncPlaylists(
  existing: Partial<Record<StageChannel, StageVideo[]>> | undefined,
  incoming: Partial<Record<StageChannel, StageVideo[]>> | undefined,
): Record<StageChannel, StageVideo[]> {
  const merged = mergeStagePlaylists(incoming);
  if (!existing) return merged;
  const base = mergeStagePlaylists(existing);
  const out = { ...merged };
  for (const channel of Object.keys(STAGE_PLAYLISTS) as StageChannel[]) {
    out[channel] = preferResolvedStagePlaylist(
      channel,
      base[channel],
      merged[channel],
    );
  }
  return out;
}

export type ScheduledVideo = {
  video: StageVideo;
  /** Index into the channel playlist. */
  index: number;
  /** Seconds into the video right now (for the `start=N` embed param). */
  offsetSec: number;
  /** Milliseconds until the schedule rotates to the next video. */
  msUntilNext: number;
};

/**
 * Pure, deterministic schedule: given the (clock-synced) wall time, returns the
 * video that should be playing for `channel` and how far into it we are. Every
 * client that agrees on `now` + `sync` computes the identical result.
 *
 * Each video's slot length is `video.durationSec ?? defaultDurationMs`, so
 * different-length videos rotate at the right time instead of a fixed interval.
 */
export function scheduleFor(
  channel: StageChannel,
  now: number,
  sync: StageSync = DEFAULT_STAGE_SYNC,
): ScheduledVideo | null {
  const list = mergeStagePlaylists(sync.playlists)[channel];
  if (!list.length) return null;

  // Build per-video durations (ms) and total cycle length.
  const durationsMs = list.map(v =>
    v.durationSec ? v.durationSec * 1000 : sync.defaultDurationMs,
  );
  const cycleMs = durationsMs.reduce((a, b) => a + b, 0);

  // Where are we in the current cycle?
  const elapsed = Math.max(0, now - sync.epoch);
  const posInCycle = elapsed % cycleMs;

  // Walk the playlist to find which video is playing and the offset within it.
  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    const slotMs = durationsMs[i];
    if (posInCycle < acc + slotMs) {
      const slotOffsetMs = posInCycle - acc;
      return {
        video: list[i],
        index: i,
        offsetSec: slotOffsetMs / 1000,
        msUntilNext: slotMs - slotOffsetMs,
      };
    }
    acc += slotMs;
  }

  // Unreachable (posInCycle < cycleMs always), but TypeScript needs a return.
  return { video: list[0], index: 0, offsetSec: 0, msUntilNext: durationsMs[0] };
}
