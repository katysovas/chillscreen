import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import {
  checkpointEasel,
  completeEasel,
  ensureEaselsForStage,
  getEaselRow,
  hideEasel,
  rowToSlotSync,
  startNewEaselDrawing,
} from '@/lib/easel/db';
import type { EaselRow } from '@/lib/easel/types';

function slotResponse(row: EaselRow) {
  return {
    ok: true,
    ...rowToSlotSync(row),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  if (!stage) return NextResponse.json({ slots: [] });
  try {
    const rows = await ensureEaselsForStage(stage);
    return NextResponse.json({ slots: rows.map(rowToSlotSync) });
  } catch (err) {
    console.error('[easel] GET failed', err);
    return NextResponse.json({ slots: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      action: 'checkpoint' | 'complete' | 'rollover' | 'hide' | 'new';
      stage: string;
      slot: number;
      segments_done?: number;
      npc?: string;
    };

    const { action, stage, slot } = body;
    if (!stage || slot == null) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const isPublic = action === 'checkpoint' || action === 'complete';
    if (!isPublic) {
      const authErr = verifyChatterRequest(req);
      if (authErr) return authErr;
    }

    switch (action) {
      case 'checkpoint': {
        const row = await getEaselRow(stage, slot);
        if (!row || row.status !== 'painting') {
          return NextResponse.json({ ok: false }, { status: 400 });
        }
        const requested = Math.max(0, Math.floor(body.segments_done ?? 0));
        const done = Math.max(
          row.segments_done,
          Math.min(requested, row.total_segments),
        );
        const updated = await checkpointEasel(stage, slot, done);
        if (!updated) return NextResponse.json({ ok: false }, { status: 404 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'complete': {
        const row = await getEaselRow(stage, slot);
        if (!row || row.status !== 'painting') {
          if (row?.status === 'done') return NextResponse.json(slotResponse(row));
          return NextResponse.json({ ok: false }, { status: 400 });
        }
        const updated = await completeEasel(stage, slot);
        if (!updated) return NextResponse.json({ ok: false }, { status: 404 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'new': {
        const authErr = verifyChatterRequest(req);
        if (authErr) return authErr;
        const npc = body.npc?.trim();
        if (!npc) return NextResponse.json({ ok: false }, { status: 400 });
        const updated = await startNewEaselDrawing(stage, slot, npc);
        if (!updated) return NextResponse.json({ ok: false }, { status: 500 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'hide':
        await hideEasel(stage, slot);
        break;
      default:
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[easel] POST failed', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
