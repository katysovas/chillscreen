import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseStageStreamUrl } from '@/lib/stages/parseStream';

export const dynamic = 'force-dynamic';

/** POST — parse + validate a YouTube URL at paste time. */
export async function POST(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json() as { url?: string };
    const url = String(body.url ?? '').trim();
    if (!url) {
      return NextResponse.json({ ok: false, reason: 'empty', message: 'Paste a YouTube link.' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    const result = await parseStageStreamUrl(url, apiKey || undefined);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/stages/parse-stream POST]', err);
    return NextResponse.json(
      { ok: false, reason: 'error', message: 'Could not parse video.' },
      { status: 500 },
    );
  }
}
