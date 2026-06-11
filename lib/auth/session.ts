import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'festie_session';
const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sessionSecret(): string {
  const secret = process.env.FESTIE_SESSION_SECRET?.trim()
    || process.env.NPC_CHATTER_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FESTIE_SESSION_SECRET is required in production');
  }
  return secret || 'dev-festie-session-insecure';
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_MS;
  const payload = `${userId}.${exp}`;
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  if (!userId || !expStr || !sig) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  const payload = `${userId}.${expStr}`;
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return userId;
}

export function sessionCookieFromRequest(request: Request): string | null {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function userIdFromRequest(request: Request): string | null {
  const token = sessionCookieFromRequest(request);
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(res: Response, userId: string): void {
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${createSessionToken(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MS / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
}

export function clearSessionCookie(res: Response): void {
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
}
