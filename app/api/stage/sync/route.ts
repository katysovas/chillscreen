import { NextResponse } from 'next/server';
import { resolveStagePlaylists } from '@/lib/resolveStagePlaylists';
import { DEFAULT_DURATION_MS, STAGE_EPOCH } from '@/lib/stageVideos';

export const dynamic = 'force-dynamic';

/** Bootstrap synchronized stage playlists (includes YouTube API channels). */
export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlists = await resolveStagePlaylists(apiKey);

  return NextResponse.json({
    serverNow: Date.now(),
    stage: {
      epoch: STAGE_EPOCH,
      defaultDurationMs: DEFAULT_DURATION_MS,
      playlists,
    },
  });
}
