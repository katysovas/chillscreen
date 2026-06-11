import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId, toFestieOwner } from '@/lib/festie/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ authenticated: false, festie: null });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ authenticated: false, festie: null });
  }

  try {
    const festie = await getFestieByUserId(userId);
    return NextResponse.json({
      authenticated: true,
      festie: festie ? toFestieOwner(festie) : null,
    });
  } catch (err) {
    console.error('[api/auth/me]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
