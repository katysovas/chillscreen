import { NextResponse } from 'next/server';
import { fetchYoutubeVideoDisplayMeta } from '@/lib/youtubeApi';

export const revalidate = 86400;

const YOUTUBE_VIDEO_ID_RE = /^[\w-]{11}$/;

function parseVideoIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(
    raw.split(',').map(id => id.trim()).filter(id => YOUTUBE_VIDEO_ID_RE.test(id)),
  )];
}

/** GET — uploader name + avatar for curated lineup rows. */
export async function GET(request: Request) {
  const ids = parseVideoIds(new URL(request.url).searchParams.get('ids'));
  if (!ids.length) {
    return NextResponse.json({ videos: {} }, { status: 400 });
  }

  const meta = await fetchYoutubeVideoDisplayMeta(ids, process.env.YOUTUBE_API_KEY);
  const videos = Object.fromEntries(meta.entries());

  return NextResponse.json(
    { videos },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
