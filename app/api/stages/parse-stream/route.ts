import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { STAGE_CONFIG } from '@/lib/stages/config';
import {
  parseStageStreamSource,
  type StageStreamPasteMode,
} from '@/lib/stages/parseStream';

export const dynamic = 'force-dynamic';

const PASTE_MODES = new Set<StageStreamPasteMode>(['video', 'playlist', 'channel', 'bulk']);

/** POST — parse + validate YouTube video, playlist, or channel at paste time. */
export async function POST(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json() as {
      url?: string;
      mode?: StageStreamPasteMode;
      existingVideoIds?: string[];
      maxToAdd?: number;
    };
    const url = String(body.url ?? '').trim();
    const mode = PASTE_MODES.has(body.mode as StageStreamPasteMode)
      ? (body.mode as StageStreamPasteMode)
      : 'video';
    const existingVideoIds = Array.isArray(body.existingVideoIds)
      ? body.existingVideoIds.filter((id): id is string => typeof id === 'string')
      : [];
    const maxToAdd = Math.min(
      STAGE_CONFIG.MAX_STREAMS,
      Math.max(1, Number(body.maxToAdd) || STAGE_CONFIG.MAX_STREAMS),
    );

    if (!url) {
      return NextResponse.json({ ok: false, reason: 'empty', message: 'Paste a YouTube link.' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    const result = await parseStageStreamSource(url, mode, {
      apiKey: apiKey || undefined,
      maxToAdd,
      existingVideoIds,
    });
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
