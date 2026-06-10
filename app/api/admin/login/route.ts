import { NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  adminSessionToken,
  isAdminEnabled,
  verifyAdminPassword,
} from '@/lib/adminAuth';

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: 'Admin is not configured' }, { status: 403 });
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = adminSessionToken()!;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
