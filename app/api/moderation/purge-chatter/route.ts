import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { purgeSenderInRoom } from '@/lib/moderation/partyRooms';
import { isSuperAdminUserId } from '@/lib/superAdmin.server';

export const dynamic = 'force-dynamic';

type PostBody = {
  roomId?: string;
  sender?: string;
};

/** POST — super admin purges a chatter sender in one PartyKit room. */
export async function POST(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  if (!(await isSuperAdminUserId(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = await req.json() as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const roomId = body.roomId?.trim();
  const sender = body.sender?.trim();
  if (!roomId || !sender) {
    return NextResponse.json({ error: 'roomId and sender required' }, { status: 400 });
  }
  if (!roomId.startsWith('whichstage-')) {
    return NextResponse.json({ error: 'Invalid room' }, { status: 400 });
  }
  if (!sender.startsWith('user:')) {
    return NextResponse.json({ error: 'Only user chatter can be purged' }, { status: 400 });
  }

  try {
    const purged = await purgeSenderInRoom(roomId, sender);
    return NextResponse.json({ ok: true, purged, sender, roomId });
  } catch (err) {
    console.error('[api/moderation/purge-chatter POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
