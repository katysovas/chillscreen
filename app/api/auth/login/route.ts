import { NextResponse } from 'next/server';
import { verifyFestieLogin } from '@/lib/auth/db';
import { setSessionCookie } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId, toFestieOwner } from '@/lib/festie/db';
import { validateFestieName, validateFestiePassword } from '@/lib/festie/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json() as { name?: string; password?: string };
    const name = String(body.name ?? '');
    const password = String(body.password ?? '');

    const nameErr = validateFestieName(name);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

    const pwErr = validateFestiePassword(password);
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

    const userId = await verifyFestieLogin(name, password);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid name or password' }, { status: 401 });
    }

    const festie = await getFestieByUserId(userId);
    const res = NextResponse.json({
      ok: true,
      festie: festie ? toFestieOwner(festie) : null,
    });
    setSessionCookie(res, userId);
    return res;
  } catch (err) {
    console.error('[api/auth/login]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
