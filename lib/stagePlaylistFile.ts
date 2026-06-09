import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import type { StageChannel, StageVideo } from './stageVideos';
import type { StagePlaylistsFile } from './stagePlaylistUtils';
import { channelStoredVideos } from './stagePlaylistUtils';

export type { StagePlaylistChannelEntry, StagePlaylistsFile } from './stagePlaylistUtils';
export { channelStoredVideos, formatDurationSec, youtubeThumbnailUrl } from './stagePlaylistUtils';

export const STAGE_PLAYLISTS_JSON_PATH = join(process.cwd(), 'data', 'stage-playlists.json');

export function readStagePlaylistsFile(): StagePlaylistsFile {
  const raw = readFileSync(STAGE_PLAYLISTS_JSON_PATH, 'utf8');
  return JSON.parse(raw) as StagePlaylistsFile;
}

export function writeStagePlaylistsFile(data: StagePlaylistsFile): void {
  mkdirSync(dirname(STAGE_PLAYLISTS_JSON_PATH), { recursive: true });
  writeFileSync(STAGE_PLAYLISTS_JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function updateChannelVideos(
  channel: StageChannel,
  videos: StageVideo[],
  opts?: { source?: 'curated' | 'youtube-api' },
): StagePlaylistsFile {
  const file = readStagePlaylistsFile();
  const prev = file.channels[channel];
  const source = opts?.source ?? 'curated';

  if (source === 'curated') {
    file.channels[channel] = {
      label: prev.label,
      source: 'curated',
      videos,
    };
  } else {
    const apiPrev = prev.source === 'youtube-api' ? prev : null;
    file.channels[channel] = {
      label: prev.label,
      source: 'youtube-api',
      searchQuery: apiPrev?.searchQuery ?? '',
      maxResults: apiPrev?.maxResults ?? 20,
      excludeTitlePatterns: apiPrev?.excludeTitlePatterns,
      fallbackVideos: videos,
    };
  }

  file.updatedAt = new Date().toISOString();
  writeStagePlaylistsFile(file);
  return file;
}
