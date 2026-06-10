/** Edge-safe admin auth helpers (middleware + shared constants). */

export const COOKIE_NAME = 'admin_auth';
const COOKIE_SALT = 'chillscreen-admin-v1';

export function getAdminPassword(): string | undefined {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p || undefined;
}

export function isAdminEnabled(): boolean {
  return !!getAdminPassword();
}

function sessionTokenInput(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return `${password}:${COOKIE_SALT}`;
}

export async function adminSessionTokenAsync(): Promise<string | null> {
  const input = sessionTokenInput();
  if (!input) return null;
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function cookieTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function isAdminAuthenticatedAsync(request: Request): Promise<boolean> {
  const expected = await adminSessionTokenAsync();
  const actual = cookieTokenFromRequest(request);
  return !!actual && !!expected && actual === expected;
}
