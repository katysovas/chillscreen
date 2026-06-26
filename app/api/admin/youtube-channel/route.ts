import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { fetchYoutubeAdminChannelVideos } from '@/lib/youtubeApi';

export const dynamic = 'force-dynamic';

/** Fetch recent uploads from a YouTube channel for localhost admin curation. */
export async function GET(request: Request) {
  try {
    await assertLocalAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel')?.trim() ?? '';
    if (!channel) {
      return NextResponse.json({ error: 'Missing channel parameter' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'YOUTUBE_API_KEY is not set in .env.local' }, { status: 503 });
    }

    const maxResults = Math.min(50, Math.max(1, parseInt(searchParams.get('max') ?? '24', 10) || 24));
    const minMin = parseInt(searchParams.get('minMin') ?? '40', 10);
    const minDurationSec = Number.isFinite(minMin) && minMin > 0 ? minMin * 60 : 0;
    const payload = await fetchYoutubeAdminChannelVideos(channel, apiKey, maxResults, minDurationSec);
    return NextResponse.json({ channel, ...payload });
  } catch (err) {
    if (err instanceof AdminForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const quotaExceeded = Boolean((err as Error & { quotaExceeded?: boolean }).quotaExceeded);
    console.error('[admin/youtube-channel]', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Channel fetch failed',
        quotaExceeded,
      },
      { status: quotaExceeded ? 429 : 500 },
    );
  }
}
