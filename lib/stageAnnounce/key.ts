import { isMatchupChannel } from '@/lib/matchup/config';
import { streamerBucket } from '@/lib/matchup/playlists';
import type { RoomState } from '@/lib/matchup/types';
import { scheduleFor, type StageChannel, type StageSync } from '@/lib/stageVideos';
import {
  announceThumbnailFromMatchupTrack,
  announceThumbnailFromStageVideo,
  announceThumbnailFromVideoId,
} from '@/lib/stageAnnounce/thumbnail';

export type AnnounceContext = {
  key: string;
  displayName: string;
  /** YouTube video frame or channel avatar for Discord embeds. */
  thumbnailUrl?: string;
};

/**
 * Stable identity for "who is now playing" — changes on koth holder swap or rotation track advance.
 */
export function currentAnnounceKey(
  channel: StageChannel,
  sync: StageSync,
  now: number,
  kothState?: RoomState | null,
): string | undefined {
  if (isMatchupChannel(channel)) {
    const holder = kothState?.holder?.trim();
    return holder || undefined;
  }

  const sched = scheduleFor(channel, now, sync);
  const id = sched?.video.id?.trim();
  return id || undefined;
}

export function announceContextFor(
  channel: StageChannel,
  sync: StageSync,
  now: number,
  kothState?: RoomState | null,
): AnnounceContext | null {
  const key = currentAnnounceKey(channel, sync, now, kothState);
  if (!key) return null;

  if (isMatchupChannel(channel)) {
    const bucket = streamerBucket(channel, key, sync);
    const displayName = bucket?.name?.trim()
      || kothState?.current.track.title?.trim()
      || key;

    const currentTrackId = kothState?.current.track.youtubeId?.trim();
    let thumbnailUrl = announceThumbnailFromMatchupTrack(kothState?.current.track);
    if (!thumbnailUrl && bucket && currentTrackId) {
      const matched = bucket.videos.find(v => v.id === currentTrackId);
      thumbnailUrl = announceThumbnailFromStageVideo(matched);
    }
    if (!thumbnailUrl && bucket?.videos.length) {
      thumbnailUrl = announceThumbnailFromStageVideo(bucket.videos[0]);
    }

    return { key, displayName, ...(thumbnailUrl ? { thumbnailUrl } : {}) };
  }

  const sched = scheduleFor(channel, now, sync);
  const displayName = sched?.video.title?.trim() || key;
  const thumbnailUrl =
    announceThumbnailFromStageVideo(sched?.video)
    ?? announceThumbnailFromVideoId(key);
  return { key, displayName, ...(thumbnailUrl ? { thumbnailUrl } : {}) };
}
