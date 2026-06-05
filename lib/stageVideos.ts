/**
 * Predefined, server-pinned video playlists for every venue ("stage channel").
 *
 * Synchronized playback is purely deterministic: every client derives the same
 * "current video + position" from a shared clock + these playlists, so everyone
 * sees the same thing at the same time on loop. No YouTube Data API and no
 * per-client randomness — just edit the lists below to curate each venue.
 *
 * This module is dependency-free (no React, no DOM, no Next aliases) so it
 * imports cleanly into both the browser bundle and the PartyKit server
 * (esbuild) where it is the authoritative source of truth.
 */

export type StageVideo = {
  id: string;
  title: string;
  /**
   * Optional clip length in seconds. When set, looping stays aligned for clips
   * shorter than the rotation window (the seek position wraps at the real
   * duration). Leave unset for long-form / livestream content — the slot
   * offset is used directly, which is correct whenever duration >= ROTATE_MS.
   */
  durationSec?: number;
};

/** One synchronized playback channel per distinct venue/stage. */
export type StageChannel =
  | 'cinema'
  | 'concert'
  | 'bumbershoot'
  | 'outside-lands'
  | 'coachella';

/** How long each video plays before the schedule rotates to the next one. */
export const ROTATE_MS = 8 * 60 * 1000;

/**
 * Fixed reference point the rotation schedule counts from. Shared by every
 * client and reconciled against the server clock, so the index + position math
 * lines up for everyone regardless of when they joined.
 */
export const STAGE_EPOCH = Date.UTC(2025, 0, 1);

/**
 * The curated playlists. Order matters — the schedule walks each list in order
 * and loops back to the top. Reorder / add / remove freely.
 */
export const STAGE_PLAYLISTS: Record<StageChannel, StageVideo[]> = {
  cinema: [
    { id: 'RhOwyHWGqWg', title: 'Cute Baby Animals 4K' },
    { id: 'jfKfPfyJRdk', title: 'Lo-Fi Girl Radio' },
    { id: '5qap5aO4i9A', title: 'Lo-Fi Beats 24/7' },
    { id: 'lTRiuFIWV54', title: 'Ocean Waves' },
    { id: 'DWcJFNfaw9c', title: 'Rain & Chill' },
  ],
  concert: [
    { id: 'jfKfPfyJRdk', title: 'Lo-Fi Girl Radio' },
    { id: '5qap5aO4i9A', title: 'Lo-Fi Beats 24/7' },
    { id: 'MVPTGNGiI-4', title: 'Jazz Café' },
    { id: 'lTRiuFIWV54', title: 'Ocean Waves' },
    { id: 'DWcJFNfaw9c', title: 'Rain & Chill' },
    { id: 'q76bMs-NwRk', title: 'Coffee Shop Ambience' },
    { id: 'n61ULEU7CO0', title: 'Midnight Jazz' },
    { id: 'kgx4WGK0oNU', title: 'Piano in the Rain' },
    { id: '7NOSDKb0HlU', title: 'Classical Vibes' },
    { id: 'HuFYqnbVbzY', title: 'City Sounds' },
  ],
  bumbershoot: [
    { id: 'jfKfPfyJRdk', title: 'Lo-Fi Girl Radio' },
    { id: 'MVPTGNGiI-4', title: 'Jazz Café' },
    { id: 'n61ULEU7CO0', title: 'Midnight Jazz' },
    { id: 'kgx4WGK0oNU', title: 'Piano in the Rain' },
    { id: '7NOSDKb0HlU', title: 'Classical Vibes' },
  ],
  'outside-lands': [
    { id: '5qap5aO4i9A', title: 'Lo-Fi Beats 24/7' },
    { id: 'q76bMs-NwRk', title: 'Coffee Shop Ambience' },
    { id: 'HuFYqnbVbzY', title: 'City Sounds' },
    { id: 'lTRiuFIWV54', title: 'Ocean Waves' },
    { id: 'DWcJFNfaw9c', title: 'Rain & Chill' },
  ],
  coachella: [
    { id: 'I3ErnkE3pGM', title: 'Kaskade' },
  ],
};

/** Timing + playlists the server pins and the client schedules against. */
export type StageSync = {
  epoch: number;
  rotateMs: number;
  playlists: Record<StageChannel, StageVideo[]>;
};

/** Fallback used before (or without) a server handshake — works single-player. */
export const DEFAULT_STAGE_SYNC: StageSync = {
  epoch: STAGE_EPOCH,
  rotateMs: ROTATE_MS,
  playlists: STAGE_PLAYLISTS,
};

export type ScheduledVideo = {
  video: StageVideo;
  /** Index into the channel playlist. */
  index: number;
  /** Seconds the video should be seeked to right now. */
  offsetSec: number;
  /** Milliseconds until the schedule rotates to the next video. */
  msUntilNext: number;
};

/**
 * Pure, deterministic schedule: given the (clock-synced) wall time, returns the
 * video that should be playing for `channel` and how far into it we are. Every
 * client that agrees on `now` + `sync` computes the identical result.
 */
export function scheduleFor(
  channel: StageChannel,
  now: number,
  sync: StageSync = DEFAULT_STAGE_SYNC,
): ScheduledVideo | null {
  const list = sync.playlists[channel];
  if (!list || list.length === 0) return null;

  const elapsed = Math.max(0, now - sync.epoch);
  const slot = Math.floor(elapsed / sync.rotateMs);
  const index = ((slot % list.length) + list.length) % list.length;
  const video = list[index];

  const slotOffsetMs = elapsed - slot * sync.rotateMs;
  const slotOffsetSec = slotOffsetMs / 1000;
  const offsetSec =
    video.durationSec && video.durationSec > 0
      ? slotOffsetSec % video.durationSec
      : slotOffsetSec;

  return {
    video,
    index,
    offsetSec,
    msUntilNext: sync.rotateMs - slotOffsetMs,
  };
}
