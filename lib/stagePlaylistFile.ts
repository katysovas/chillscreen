import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import type { StageChannel, StageVideo } from './stageVideos';
import type { StagePlaylistsFile } from './stagePlaylistUtils';
import { channelStoredVideos } from './stagePlaylistUtils';

export type { StagePlaylistChannelEntry, StagePlaylistsFile } from './stagePlaylistUtils';
export { channelStoredVideos, formatDurationSec, youtubeThumbnailUrl } from './stagePlaylistUtils';

export const STAGE_PLAYLISTS_JSON_PATH = join(process.cwd(), 'data', 'stage-playlists.json');
const STAGE_PLAYLIST_CHANNEL_DIR = join(process.cwd(), 'data', 'stage-playlists', 'channels');

function writeStagePlaylistChannelFile(channel: StageChannel, entry: StagePlaylistsFile['channels'][StageChannel]): void {
  mkdirSync(STAGE_PLAYLIST_CHANNEL_DIR, { recursive: true });
  writeFileSync(
    join(STAGE_PLAYLIST_CHANNEL_DIR, `${channel}.json`),
    `${JSON.stringify(entry, null, 2)}\n`,
    'utf8',
  );
}

function syncStagePlaylistChannelFiles(file: StagePlaylistsFile): void {
  for (const channel of Object.keys(file.channels) as StageChannel[]) {
    writeStagePlaylistChannelFile(channel, file.channels[channel]);
  }
}

export function readStagePlaylistsFile(): StagePlaylistsFile {
  const raw = readFileSync(STAGE_PLAYLISTS_JSON_PATH, 'utf8');
  return JSON.parse(raw) as StagePlaylistsFile;
}

export function writeStagePlaylistsFile(data: StagePlaylistsFile): void {
  mkdirSync(dirname(STAGE_PLAYLISTS_JSON_PATH), { recursive: true });
  writeFileSync(STAGE_PLAYLISTS_JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  syncStagePlaylistChannelFiles(data);
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
