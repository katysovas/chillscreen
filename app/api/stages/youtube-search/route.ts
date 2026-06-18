import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchYoutubeAdminSearch } from '@/lib/youtubeApi';

export const dynamic = 'force-dynamic';

/** Search YouTube for embeddable videos when building a creator stage lineup. */
export async function GET(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube search is not configured' }, { status: 503 });
    }

    const maxResults = Math.min(50, Math.max(1, parseInt(searchParams.get('max') ?? '20', 10) || 20));
    const results = await fetchYoutubeAdminSearch(q, apiKey, maxResults);
    return NextResponse.json({ query: q, results });
  } catch (err) {
    const quotaExceeded = Boolean((err as Error & { quotaExceeded?: boolean }).quotaExceeded);
    console.error('[api/stages/youtube-search]', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Search failed',
        quotaExceeded,
      },
      { status: quotaExceeded ? 429 : 500 },
    );
  }
}
