import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import {
  resolveStagePlaylists,
  STAGE_PLAYLIST_CACHE_SECONDS,
} from '@/lib/resolveStagePlaylists';
import { DEFAULT_DURATION_MS, STAGE_EPOCH } from '@/lib/stageVideos';

/** Align with the 1-hour resolver cache — playlists change slowly. */
export const revalidate = 3600;

const getPlaylists = unstable_cache(
  async () => resolveStagePlaylists(process.env.YOUTUBE_API_KEY),
  ['stage-playlists-v2'],
  { revalidate: STAGE_PLAYLIST_CACHE_SECONDS },
);

/** Bootstrap synchronized stage playlists (includes YouTube API channels). */
export async function GET() {
  const playlists = await getPlaylists();
  const serverNow = Date.now();

  return NextResponse.json(
    {
      serverNow,
      stage: {
        epoch: STAGE_EPOCH,
        defaultDurationMs: DEFAULT_DURATION_MS,
        playlists,
      },
    },
    {
      headers: {
        // Edge cache the full payload; clients adjust serverNow via the Age header.
        'Cache-Control': `public, s-maxage=${STAGE_PLAYLIST_CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  );
}
