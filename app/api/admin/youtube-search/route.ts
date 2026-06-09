import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { fetchYoutubeAdminSearch } from '@/lib/youtubeApi';

export const dynamic = 'force-dynamic';

/** Search YouTube for localhost admin curation. */
export async function GET(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'YOUTUBE_API_KEY is not set in .env.local' }, { status: 503 });
    }

    const maxResults = Math.min(50, Math.max(1, parseInt(searchParams.get('max') ?? '24', 10) || 24));
    const results = await fetchYoutubeAdminSearch(q, apiKey, maxResults);
    return NextResponse.json({ query: q, results });
  } catch (err) {
    if (err instanceof AdminForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const quotaExceeded = Boolean((err as Error & { quotaExceeded?: boolean }).quotaExceeded);
    console.error('[admin/youtube-search]', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Search failed',
        quotaExceeded,
      },
      { status: quotaExceeded ? 429 : 500 },
    );
  }
}
