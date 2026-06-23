import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import {
  resolveStagePlaylists,
  STAGE_PLAYLIST_CACHE_SECONDS,
} from '@/lib/resolveStagePlaylists';
import { DEFAULT_DURATION_MS, STAGE_EPOCH, STAGE_MATCHUP_CONFIG, type StageChannel } from '@/lib/stageVideos';

/** Align with the 1-hour resolver cache — playlists change slowly. */
export const revalidate = 3600;

const getPlaylists = unstable_cache(
  async () => resolveStagePlaylists(process.env.YOUTUBE_API_KEY),
  ['stage-playlists-v2'],
  { revalidate: STAGE_PLAYLIST_CACHE_SECONDS },
);

const STAGE_CHANNEL_SET = new Set<string>([
  'cinema',
  'deep-space',
  'bumbershoot',
  'outside-lands',
  'coachella',
  'edc',
  'which-stage',
  'forest',
  'silent-disco',
  'hula',
  'headliner',
]);

function parseChannelParam(raw: string | null): StageChannel | null {
  if (!raw || !STAGE_CHANNEL_SET.has(raw)) return null;
  return raw as StageChannel;
}

/** Bootstrap synchronized stage playlists (includes YouTube API channels). */
export async function GET(request: Request) {
  const playlists = await getPlaylists();
  const serverNow = Date.now();
  const channel = parseChannelParam(new URL(request.url).searchParams.get('channel'));

  const payloadPlaylists = channel
    ? { [channel]: playlists[channel] }
    : playlists;

  return NextResponse.json(
    {
      serverNow,
      stage: {
        epoch: STAGE_EPOCH,
        defaultDurationMs: DEFAULT_DURATION_MS,
        playlists: payloadPlaylists,
        matchup: channel
          ? (STAGE_MATCHUP_CONFIG[channel] ? { [channel]: STAGE_MATCHUP_CONFIG[channel] } : {})
          : STAGE_MATCHUP_CONFIG,
      },
    },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${STAGE_PLAYLIST_CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  );
}
