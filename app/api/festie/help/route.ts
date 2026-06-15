import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { dismissFestieHelp, FestieSchemaError, getFestieByUserId, toFestieOwner } from '@/lib/festie/db';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
}

function dbUnavailable() {
  return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
}

/** POST — mark the one-time help popup as dismissed. */
export async function POST(request: Request) {
  if (!getDb()) return dbUnavailable();
  const userId = userIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const existing = await getFestieByUserId(userId);
    if (!existing) return NextResponse.json({ error: 'Festie not found' }, { status: 404 });
    if (existing.help_dismissed_at) {
      return NextResponse.json({ festie: toFestieOwner(existing) });
    }

    const festie = await dismissFestieHelp(userId);
    if (!festie) return NextResponse.json({ error: 'Festie not found' }, { status: 404 });
    return NextResponse.json({ festie: toFestieOwner(festie) });
  } catch (err) {
    if (err instanceof FestieSchemaError) {
      console.error('[api/festie/help POST] schema', err.migration, err.message);
      return NextResponse.json(
        { error: err.message, migration: err.migration },
        { status: 503 },
      );
    }
    console.error('[api/festie/help POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
