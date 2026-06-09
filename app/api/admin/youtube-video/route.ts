import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { parseYoutubeVideoId, resolveAdminYoutubeVideo } from '@/lib/youtubeApi';

export const dynamic = 'force-dynamic';

/** Look up one YouTube video by URL or id (no search quota). */
export async function GET(request: Request) {
  try {
    assertLocalAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('url') ?? searchParams.get('id') ?? '';
    if (!input.trim()) {
      return NextResponse.json({ error: 'Missing url or id parameter' }, { status: 400 });
    }
    if (!parseYoutubeVideoId(input)) {
      return NextResponse.json({ error: 'Could not parse a YouTube video id' }, { status: 400 });
    }

    const video = await resolveAdminYoutubeVideo(input, process.env.YOUTUBE_API_KEY);
    return NextResponse.json({ video });
  } catch (err) {
    if (err instanceof AdminForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[admin/youtube-video]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lookup failed' },
      { status: 500 },
    );
  }
}
