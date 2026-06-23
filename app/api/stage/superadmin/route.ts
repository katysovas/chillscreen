import { NextResponse } from 'next/server';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import { isSuperAdminUserId } from '@/lib/superAdmin.server';

export const dynamic = 'force-dynamic';

/** GET — PartyKit checks whether a signed-in user is HuskyNights (shared secret). */
export async function GET(request: Request) {
  const denied = verifyChatterRequest(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId')?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const superAdmin = await isSuperAdminUserId(userId);
    return NextResponse.json({ superAdmin });
  } catch (err) {
    console.error('[api/stage/superadmin GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
