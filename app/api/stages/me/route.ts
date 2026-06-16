import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import {
  getUserStageByOwnerId,
  toUserStagePublic,
} from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

/** GET — signed-in owner's stage (if any). */
export async function GET(req: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const row = await getUserStageByOwnerId(userId);
    return NextResponse.json({ stage: row ? toUserStagePublic(row) : null });
  } catch (err) {
    console.error('[api/stages/me GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
