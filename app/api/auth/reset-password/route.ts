import { NextResponse } from 'next/server';
import { hashPassword, resetPasswordWithToken } from '@/lib/auth/passwordReset';
import { getDb } from '@/lib/db';
import { validateFestiePassword } from '@/lib/festie/validation';

export const dynamic = 'force-dynamic';

/** POST — set a new password using a reset token from email. */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json() as { token?: string; newPassword?: string };
    const token = String(body.token ?? '').trim();
    const newPassword = String(body.newPassword ?? '');

    if (!token) {
      return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 });
    }

    const pwErr = validateFestiePassword(newPassword);
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

    const result = await resetPasswordWithToken(token, hashPassword(newPassword));
    if (result === 'invalid') {
      return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/auth/reset-password]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
