import { createHash, randomBytes } from 'crypto';
import { hashPassword } from '@/lib/auth/password';
import { requireDb } from '@/lib/db';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account with that festie name and email exists, we sent a password reset link.';

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createPasswordResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

type FestieEmailMatch = {
  userId: string;
  festieName: string;
  email: string;
};

/** Case-insensitive festie name + notify email match. */
export async function findFestieForPasswordReset(
  name: string,
  email: string,
): Promise<FestieEmailMatch | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT f.user_id, f.name, f.notify_email
    FROM festies f
    WHERE lower(trim(f.name)) = lower(trim(${name}))
    LIMIT 1
  `;
  const row = rows[0] as {
    user_id: string;
    name: string;
    notify_email: string | null;
  } | undefined;
  if (!row?.notify_email?.trim()) return null;
  if (row.notify_email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return null;
  }
  return {
    userId: String(row.user_id),
    festieName: String(row.name),
    email: row.notify_email.trim(),
  };
}

export async function storePasswordResetToken(userId: string, token: string): Promise<void> {
  const sql = requireDb();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await sql`
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE user_id = ${userId}::uuid
      AND used_at IS NULL
  `;

  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}::uuid, ${tokenHash}, ${expiresAt}::timestamptz)
  `;
}

export async function resetPasswordWithToken(
  token: string,
  newPasswordHash: string,
): Promise<'ok' | 'invalid'> {
  const sql = requireDb();
  const tokenHash = hashResetToken(token);
  const rows = await sql`
    SELECT id, user_id
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > now()
    LIMIT 1
  `;
  const row = rows[0] as { id: string; user_id: string } | undefined;
  if (!row) return 'invalid';

  await sql`
    UPDATE users
    SET password_hash = ${newPasswordHash}
    WHERE id = ${row.user_id}::uuid
  `;

  await sql`
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE id = ${row.id}::uuid
  `;

  await sql`
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE user_id = ${row.user_id}::uuid
      AND used_at IS NULL
  `;

  return 'ok';
}

export { hashPassword };
