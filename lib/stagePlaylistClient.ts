import type { StageChannel, StageVideo } from '@/lib/stageSyncCore';

type CuratedChannelFile = {
  source: 'curated';
  videos: StageVideo[];
  excludeTitlePatterns?: string[];
};

type YoutubeApiChannelFile = {
  source: 'youtube-api';
  fallbackVideos?: StageVideo[];
  excludeTitlePatterns?: string[];
};

type ChannelFile = (CuratedChannelFile | YoutubeApiChannelFile) & { label?: string };

const GLOBAL_EXCLUDE = ['monster'];

function filterVideos(videos: StageVideo[], stagePatterns?: string[]): StageVideo[] {
  const patterns = [...GLOBAL_EXCLUDE, ...(stagePatterns ?? [])];
  if (!patterns.length) return videos;
  return videos.filter(v => {
    const norm = v.title.toLowerCase();
    return !patterns.some(p => norm.includes(p.toLowerCase()));
  });
}

function videosFromChannelFile(cfg: ChannelFile): StageVideo[] {
  const raw = cfg.source === 'curated' ? cfg.videos : (cfg.fallbackVideos ?? []);
  return filterVideos(raw, cfg.excludeTitlePatterns);
}

const CHANNEL_IMPORTS: Record<
  StageChannel,
  () => Promise<{ default: ChannelFile }>
> = {
  cinema: () => import('@/data/stage-playlists/channels/cinema.json').then(m => ({ default: m.default as ChannelFile })),
  'deep-space': () => import('@/data/stage-playlists/channels/deep-space.json').then(m => ({ default: m.default as ChannelFile })),
  bumbershoot: () => import('@/data/stage-playlists/channels/bumbershoot.json').then(m => ({ default: m.default as ChannelFile })),
  'outside-lands': () => import('@/data/stage-playlists/channels/outside-lands.json').then(m => ({ default: m.default as ChannelFile })),
  coachella: () => import('@/data/stage-playlists/channels/coachella.json').then(m => ({ default: m.default as ChannelFile })),
  edc: () => import('@/data/stage-playlists/channels/edc.json').then(m => ({ default: m.default as ChannelFile })),
  'which-stage': () => import('@/data/stage-playlists/channels/which-stage.json').then(m => ({ default: m.default as ChannelFile })),
  forest: () => import('@/data/stage-playlists/channels/forest.json').then(m => ({ default: m.default as ChannelFile })),
  'silent-disco': () => import('@/data/stage-playlists/channels/silent-disco.json').then(m => ({ default: m.default as ChannelFile })),
  hula: () => import('@/data/stage-playlists/channels/hula.json').then(m => ({ default: m.default as ChannelFile })),
};

const cache = new Map<StageChannel, StageVideo[]>();

export function preloadStagePlaylistChannel(channel: StageChannel): Promise<StageVideo[]> {
  return loadStagePlaylistChannel(channel);
}

export function loadStagePlaylistChannel(channel: StageChannel): Promise<StageVideo[]> {
  const hit = cache.get(channel);
  if (hit) return Promise.resolve(hit);

  return CHANNEL_IMPORTS[channel]().then(mod => {
    const videos = videosFromChannelFile(mod.default);
    cache.set(channel, videos);
    return videos;
  });
}

export function getCachedStagePlaylistChannel(channel: StageChannel): StageVideo[] | null {
  return cache.get(channel) ?? null;
}
