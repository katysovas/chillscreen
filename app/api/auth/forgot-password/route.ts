import { NextResponse } from 'next/server';
import {
  createPasswordResetToken,
  findFestieForPasswordReset,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  storePasswordResetToken,
} from '@/lib/auth/passwordReset';
import { sendPasswordResetEmail } from '@/lib/auth/passwordResetEmail';
import { getDb } from '@/lib/db';
import { validateFestieName, validateNotifyEmail } from '@/lib/festie/validation';

export const dynamic = 'force-dynamic';

/** POST — request a password reset email (festie name + saved notify email). */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json() as { name?: string; email?: string };
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();

    const nameErr = validateFestieName(name);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

    const emailErr = validateNotifyEmail(email);
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

    const match = await findFestieForPasswordReset(name, email);
    if (match) {
      const token = createPasswordResetToken();
      await storePasswordResetToken(match.userId, token);
      await sendPasswordResetEmail({
        to: match.email,
        festieName: match.festieName,
        token,
      });
    }

    return NextResponse.json({ ok: true, message: PASSWORD_RESET_SUCCESS_MESSAGE });
  } catch (err) {
    console.error('[api/auth/forgot-password]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
