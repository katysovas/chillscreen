import { createHash, timingSafeEqual } from 'crypto';
import { userIdFromRequest } from '@/lib/auth/session';
import {
  COOKIE_NAME,
  cookieTokenFromRequest,
  getAdminPassword,
  isAdminEnabled,
} from '@/lib/adminAuthCore';
import { isSuperAdminUserId } from '@/lib/superAdmin.server';

const COOKIE_SALT = 'chillscreen-admin-v1';

export { COOKIE_NAME, getAdminPassword, isAdminEnabled } from '@/lib/adminAuthCore';
export { isAdminAuthenticatedAsync } from '@/lib/adminAuthCore';

function sessionTokenInput(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return `${password}:${COOKIE_SALT}`;
}

export function adminSessionToken(): string | null {
  const input = sessionTokenInput();
  if (!input) return null;
  return createHash('sha256').update(input).digest('hex');
}

export function tokensMatch(actual: string | null | undefined, expected: string | null): boolean {
  if (!actual || !expected || actual.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isAdminAuthenticated(request: Request): boolean {
  return tokensMatch(cookieTokenFromRequest(request), adminSessionToken());
}

export function verifyAdminPassword(input: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export class AdminForbiddenError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'AdminForbiddenError';
  }
}

export function assertAdminRequest(request: Request): void {
  if (!isAdminEnabled()) {
    throw new AdminForbiddenError('Admin is not configured');
  }
  if (!isAdminAuthenticated(request)) {
    throw new AdminForbiddenError('Admin authentication required');
  }
}

/** Admin password cookie or signed-in super admin (HuskyNights). */
export async function assertAdminOrSuperAdminRequest(request: Request): Promise<void> {
  const userId = userIdFromRequest(request);
  if (userId && await isSuperAdminUserId(userId)) return;

  if (!isAdminEnabled()) {
    throw new AdminForbiddenError('Admin is not configured');
  }
  if (!isAdminAuthenticated(request)) {
    throw new AdminForbiddenError('Admin authentication required');
  }
}
