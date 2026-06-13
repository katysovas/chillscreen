import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import {
  checkpointEasel,
  completeEasel,
  ensureEaselsForStage,
  getEaselsForStage,
  getEaselRow,
  hideEasel,
  rolloverEasel,
} from '@/lib/easel/db';
import type { EaselRow } from '@/lib/easel/types';
import { getDrawingForNpc, npcPoolKey } from '@/lib/easel/drawingsPool';
import { nextDrawingIndex, totalSegments } from '@/lib/easel/segments';

function slotResponse(row: EaselRow) {
  return {
    ok: true,
    segments_done: row.segments_done,
    started_at: row.started_at,
    status: row.status,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  if (!stage) return NextResponse.json({ slots: [] });
  try {
    const slots = await ensureEaselsForStage(stage);
    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ slots: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      action: 'checkpoint' | 'complete' | 'rollover' | 'hide';
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
      case 'rollover': {
        const npc = body.npc;
        if (!npc) return NextResponse.json({ ok: false }, { status: 400 });
        const key = npcPoolKey(npc);
        const pool = await getEaselsForStage(stage);
        const row = pool.find(r => r.slot === slot);
        const currentId = row?.drawing_id ?? '';
        const poolDrawings = (await import('@/lib/easel/drawingsPool')).getNpcPool(key)?.drawings ?? [];
        const idx = nextDrawingIndex(key, currentId, poolDrawings.length);
        const next = getDrawingForNpc(key, idx);
        if (!next) return NextResponse.json({ ok: false }, { status: 404 });
        await rolloverEasel(stage, slot, npc, next.id, totalSegments(next));
        break;
      }
      case 'hide':
        await hideEasel(stage, slot);
        break;
      default:
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
