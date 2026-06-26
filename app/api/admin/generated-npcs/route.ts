import { NextResponse } from 'next/server';
import { AdminForbiddenError, assertLocalAdminRequest } from '@/lib/adminLocalhost';
import { readGeneratedNpcsFile, updateChannelNpcs } from '@/lib/generatedNpcsFile';
import { NPC_STAGE_CONTEXT, type GeneratedNpc } from '@/lib/npcGenerator';
import type { StageChannel } from '@/lib/stageVideos';

export const dynamic = 'force-dynamic';

function adminError(err: unknown) {
  if (err instanceof AdminForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[admin/generated-npcs]', err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : 'Server error' },
    { status: 500 },
  );
}

/** Load `data/generated-npcs.json`. */
export async function GET(request: Request) {
  try {
    await assertLocalAdminRequest(request);
    return NextResponse.json(readGeneratedNpcsFile());
  } catch (err) {
    return adminError(err);
  }
}

type SaveBody = {
  channel: StageChannel;
  npcs: GeneratedNpc[];
};

/** Save one stage's generated NPCs to `data/generated-npcs.json`. */
export async function PUT(request: Request) {
  try {
    await assertLocalAdminRequest(request);
    const body = (await request.json()) as SaveBody;
    if (!body.channel || !(body.channel in NPC_STAGE_CONTEXT) || !Array.isArray(body.npcs)) {
      return NextResponse.json({ error: 'channel and npcs required' }, { status: 400 });
    }
    const file = updateChannelNpcs(body.channel, body.npcs);
    return NextResponse.json({ ok: true, updatedAt: file.updatedAt });
  } catch (err) {
    return adminError(err);
  }
}
