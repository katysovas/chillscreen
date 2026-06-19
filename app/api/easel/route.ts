import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import {
  advanceEaselAfterHold,
  checkpointEasel,
  completeEasel,
  ensureEaselSessionStarted,
  getEaselRow,
  getVisibleEasels,
  hideEasel,
  rowToSlotSync,
  startNewEaselDrawing,
  syncEaselSessionForPlayers,
} from '@/lib/easel/db';
import { easelHoldExpired } from '@/lib/easel/lifecycle';
import type { EaselRow } from '@/lib/easel/types';
import { canonicalVenueSlug } from '@/lib/venueSlugs';

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
  const stageKey = canonicalVenueSlug(stage);

  const ensure = searchParams.get('ensure') === '1';
  const sync = searchParams.get('sync') === '1';

  try {
    const rows = ensure
      ? await ensureEaselSessionStarted(stageKey)
      : sync
        ? await syncEaselSessionForPlayers(stageKey)
        : await getVisibleEasels(stageKey);
    return NextResponse.json({ slots: rows.map(rowToSlotSync) });
  } catch (err) {
    console.error('[easel] GET failed', err);
    return NextResponse.json({ slots: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      action: 'checkpoint' | 'complete' | 'rollover' | 'hide' | 'new' | 'ensureSession' | 'advanceIfReady';
      stage: string;
      slot: number;
      segments_done?: number;
      npc?: string;
    };

    const { action, stage, slot } = body;
    if (!stage) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const stageKey = canonicalVenueSlug(stage);

    const isPublic = action === 'checkpoint'
      || action === 'complete'
      || action === 'ensureSession'
      || action === 'advanceIfReady';
    if (!isPublic) {
      const authErr = verifyChatterRequest(req);
      if (authErr) return authErr;
    }

    switch (action) {
      case 'ensureSession': {
        const rows = await ensureEaselSessionStarted(stageKey);
        return NextResponse.json({ ok: true, slots: rows.map(rowToSlotSync) });
      }
      case 'advanceIfReady': {
        if (slot == null) return NextResponse.json({ ok: false }, { status: 400 });
        const current = await getEaselRow(stageKey, slot);
        if (!current) return NextResponse.json({ ok: false }, { status: 404 });
        if (current.status !== 'done') {
          return NextResponse.json(slotResponse(current));
        }
        if (!easelHoldExpired(current.completed_at)) {
          return NextResponse.json({ ok: true, waiting: true, ...rowToSlotSync(current) });
        }
        const updated = await advanceEaselAfterHold(stageKey, slot);
        if (!updated) return NextResponse.json({ ok: false }, { status: 500 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'checkpoint': {
        if (slot == null) return NextResponse.json({ ok: false }, { status: 400 });
        const row = await getEaselRow(stageKey, slot);
        if (!row) return NextResponse.json({ ok: false }, { status: 404 });
        if (row.hidden_at || row.status === 'done') {
          return NextResponse.json(slotResponse(row));
        }
        if (row.status !== 'painting') {
          return NextResponse.json({ ok: false }, { status: 400 });
        }
        const requested = Math.max(0, Math.floor(body.segments_done ?? 0));
        const done = Math.max(
          row.segments_done,
          Math.min(requested, row.total_segments),
        );
        const updated = await checkpointEasel(stageKey, slot, done);
        if (!updated) return NextResponse.json({ ok: false }, { status: 404 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'complete': {
        if (slot == null) return NextResponse.json({ ok: false }, { status: 400 });
        const row = await getEaselRow(stageKey, slot);
        if (!row) return NextResponse.json({ ok: false }, { status: 404 });
        if (row.hidden_at || row.status === 'done') {
          return NextResponse.json(slotResponse(row));
        }
        if (row.status !== 'painting') {
          return NextResponse.json({ ok: false }, { status: 400 });
        }
        const updated = await completeEasel(stageKey, slot);
        if (!updated) return NextResponse.json({ ok: false }, { status: 404 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'new': {
        const authErr = verifyChatterRequest(req);
        if (authErr) return authErr;
        if (slot == null) return NextResponse.json({ ok: false }, { status: 400 });
        const npc = body.npc?.trim();
        if (!npc) return NextResponse.json({ ok: false }, { status: 400 });
        const updated = await startNewEaselDrawing(stageKey, slot, npc);
        if (!updated) return NextResponse.json({ ok: false }, { status: 500 });
        return NextResponse.json(slotResponse(updated));
      }
      case 'hide':
        if (slot == null) return NextResponse.json({ ok: false }, { status: 400 });
        await hideEasel(stageKey, slot);
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
