import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { listActiveFestiesForStage } from '@/lib/festie/db';
import { resolveStageSlugForFestie } from '@/lib/stages/resolveStageSlug';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** GET — festies for a PartyKit room: locals + any signed-in visitors in the room. */
export async function GET(req: Request) {
  const denied = verifyChatterRequest(req);
  if (denied) return denied;

  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const url = new URL(req.url);
  const stageSlug = await resolveStageSlugForFestie(url.searchParams.get('stage_slug') ?? '');
  if (!stageSlug) {
    return NextResponse.json({ error: 'Invalid stage_slug' }, { status: 400 });
  }

  const onlineRaw = url.searchParams.get('online') ?? '';
  const onlineUserIds = onlineRaw
    .split(',')
    .map(s => s.trim())
    .filter(id => UUID_RE.test(id));

  try {
    const festies = await listActiveFestiesForStage(stageSlug, onlineUserIds);
    return NextResponse.json({
      festies: festies.filter(f => f.tier !== 'gone'),
    });
  } catch (err) {
    console.error('[api/festies/stage GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
