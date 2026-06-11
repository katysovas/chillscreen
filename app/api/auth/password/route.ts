import { NextResponse } from 'next/server';
import { updateUserPassword } from '@/lib/auth/db';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { validateFestiePassword } from '@/lib/festie/validation';

export const dynamic = 'force-dynamic';

/** PATCH — change account password (requires current password). */
export async function PATCH(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    const pwErr = validateFestiePassword(newPassword);
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    const result = await updateUserPassword(userId, currentPassword, newPassword);
    if (result === 'wrong_password') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }
    if (result === 'no_password') {
      return NextResponse.json({ error: 'Account has no password set' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/auth/password PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
