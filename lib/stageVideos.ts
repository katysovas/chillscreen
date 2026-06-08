/**
 * Predefined, server-pinned video playlists for every venue ("stage channel").
 *
 * Synchronized playback is purely deterministic: every client derives the same
 * "current video + position" from a shared clock + these playlists, so everyone
 * sees the same thing at the same time on loop.
 *
 * Channels use either:
 *   • `source: 'curated'` — hardcoded video IDs in this file
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
  | 'edc';

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
  return [...GLOBAL_EXCLUDE_TITLE_PATTERNS, ...(stagePatterns ?? [])];
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

/**
 * Per-channel playback source. Edit this to curate venues or point a stage at
 * YouTube search results instead of hardcoded IDs.
 */
export const STAGE_CHANNEL_CONFIG: Record<StageChannel, StageChannelConfig> = {
  cinema: {
    source: 'curated',
    videos: [
      { id: 'RhOwyHWGqWg', title: 'Cute Baby Animals', durationSec: 11673 },
      { id: 'lTRiuFIWV54', title: 'Ocean Waves', durationSec: 3674 },
    ],
  },
  bumbershoot: {
    source: 'youtube-api',
    searchQuery: 'Seattle Full Concert',
    maxResults: 20,
    excludeTitlePatterns: ['pearl jam'],
    fallbackVideos: [
      { id: 'iqQvfMi4UIk', title: 'AURORA', durationSec: 4251 },
      { id: 'SDHXMAxVe5Q', title: 'Elliott Smith', durationSec: 4148 },
      { id: '0rkjl7oJfLc', title: 'st', durationSec: 3838 },
    ],
  },
  'outside-lands': {
    source: 'curated',
    videos: [
      { id: 'uQ588C9Ecp4', title: 'Fisher', durationSec: 4381 },
      { id: 'fauxnAUc-c4', title: 'Phoebe Bridgers', durationSec: 4214 },
      { id: 'Yysc6zA1lUY', title: 'Hozier', durationSec: 5773 },
      { id: 'PeMr2TQEObc', title: 'Jhon Summit ', durationSec: 4776 },
      { id: 'KDVQA5oL7sQ', title: 'GRYFFIN', durationSec: 4477 },
      { id: 'Ca2XXPfWdqU', title: 'flipturn', durationSec: 2755 },
      { id: '3NyGf1X_gFA', title: 'Kaytranada', durationSec: 4241 },
      { id: 'xPOHO1IASIA', title: 'Royel Otis', durationSec: 2713 },
      { id: 'XlCjUPZCKfo', title: 'Gracie Abrams', durationSec: 3550 },
      { id: '048WNnE6Un8', title: 'DOJA CAT', durationSec: 4255 },
      { id: 'KDVQA5oL7sQ', title: 'GRYFFIN', durationSec: 4477 },
      { id: 'jWAYwqdeePs', title: 'Beck with Berkeley Symphony', durationSec: 4661 },
      { id: 'lEeg6rUFB4I', title: 'Sturgill Simpson', durationSec: 5413 },
      { id: 'Kq1iA7XNJfA', title: 'Artemas', durationSec: 2891 },
      { id: 'g0x172YBqy0', title: 'Gracie Abrams', durationSec: 3426 },
      { id: 'tVWGigkYBgU', title: 'Wallows', durationSec: 3010 },
      { id: 'ijGHk8NSQBc', title: 'Green Day', durationSec: 6337 },
      { id: 'AVYJWfjnEfA', title: 'Anderson .Paak & The Free Nationals', durationSec: 4406 },
      { id: 'b3lbLWae_rE', title: 'Lord Huron', durationSec: 4357 },
      { id: 'AkUMdR_a19g', title: 'Tyler, The Creator', durationSec: 4341 },
      { id: 'Dz6OF5NLVS8', title: 'Zeds Dead', durationSec: 4506 },
      { id: 'xr3aTmSn5Gw', title: 'The Strokes', durationSec: 3726 },

    ],
  },
  coachella: {
    source: 'curated',
    videos: [
      { id: 'EkIfxAHlgJA', title: 'Coachella' },
    ],
  },
  edc: {
    source: 'youtube-api',
    searchQuery: 'Vegas EDC Full Set',
    maxResults: 20,
    fallbackVideos: [
      { id: 'uQ588C9Ecp4', title: 'Fisher', durationSec: 4381 },
      { id: '3NyGf1X_gFA', title: 'Kaytranada', durationSec: 4241 },
      { id: 'PeMr2TQEObc', title: 'John Summit', durationSec: 4776 },
    ],
  },
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
  const list = sync.playlists[channel];
  if (!list || list.length === 0) return null;

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
