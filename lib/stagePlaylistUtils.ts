import type { StageChannel, StageChannelConfig, StageVideo } from './stageVideos';

import type { MatchupStageConfig } from './matchup/normalize';

export type StagePlaylistChannelEntry = StageChannelConfig & {
  label?: string;
  /** King-of-the-hill vote buckets (per-streamer video lists). */
  matchup?: MatchupStageConfig;
};

export type StagePlaylistsFile = {
  version: 1;
  updatedAt: string;
  channels: Record<StageChannel, StagePlaylistChannelEntry>;
};

export function formatDurationSec(sec: number | undefined | null): string {
  if (sec == null || sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Prefer channel page when stored on the video; otherwise open the video. */
export function videoBrowseUrl(video: StageVideo): string {
  if (video.channelUrl?.trim()) return video.channelUrl.trim();
  return youtubeWatchUrl(video.id);
}

/** Videos stored for a channel (curated list or youtube-api fallbacks). */
export function channelStoredVideos(entry: StagePlaylistChannelEntry): StageVideo[] {
  if (entry.source === 'curated') return entry.videos;
  return entry.fallbackVideos ?? [];
}
