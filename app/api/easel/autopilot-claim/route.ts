import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId } from '@/lib/festie/db';
import { festieNpcId } from '@/lib/festie/toCharacterDef';
import {
  getEaselRow,
  getVisibleEasels,
  rowToSlotSync,
  startNewEaselDrawing,
} from '@/lib/easel/db';
import { slimSlotForSync } from '@/lib/easel/resolveProgram';
import { canonicalVenueSlug } from '@/lib/venueSlugs';

/** POST — assign the signed-in owner's festie to the street easel. */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await request.json() as { stage?: string };
    const stage = canonicalVenueSlug(String(body.stage ?? '').trim());
    if (!stage) {
      return NextResponse.json({ error: 'stage is required' }, { status: 400 });
    }

    const festie = await getFestieByUserId(userId);
    if (!festie) {
      return NextResponse.json({ error: 'festie not found' }, { status: 404 });
    }

    const npcId = festieNpcId(festie.id);
    const slot = 0;
    const current = await getEaselRow(stage, slot);

    if (current?.status === 'painting' && current.npc === npcId) {
      return NextResponse.json({
        ok: true,
        slot: slimSlotForSync(rowToSlotSync(current)),
      });
    }

    if (current?.status === 'painting' && current.npc !== npcId) {
      return NextResponse.json({ error: 'easel_busy' }, { status: 409 });
    }

    const updated = await startNewEaselDrawing(stage, slot, npcId);
    if (!updated) {
      return NextResponse.json({ error: 'claim_failed' }, { status: 500 });
    }

    await getVisibleEasels(stage);
    return NextResponse.json({
      ok: true,
      slot: slimSlotForSync(rowToSlotSync(updated)),
    });
  } catch (err) {
    console.error('[api/easel/autopilot-claim POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
