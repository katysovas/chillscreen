import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runOfflineFestieChatterCron } from '@/lib/festie/offlineChatterCron';

export const dynamic = 'force-dynamic';
/** One festie convo ≈ several LLM calls; keep headroom for a small batch. */
export const maxDuration = 120;

function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV === 'development';

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** GET — Vercel cron: one LLM NPC chat per eligible offline festie (~every 2h). */
export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const result = await runOfflineFestieChatterCron(5);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/festie-offline-chatter]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
