import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import { listModerationBlocks } from '@/lib/moderation/db';

export const dynamic = 'force-dynamic';

/** PartyKit polls this — shared secret, not public. */
export async function GET(req: Request) {
  const authErr = verifyChatterRequest(req);
  if (authErr) return authErr;

  try {
    const blocks = await listModerationBlocks();
    return NextResponse.json({ blocks });
  } catch (err) {
    console.error('[moderation/blocklist]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
