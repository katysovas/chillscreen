import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { requireDb } from '@/lib/db';

export async function createUserWithPassword(passwordHash: string): Promise<string> {
  const sql = requireDb();
  const rows = await sql`
    INSERT INTO users (password_hash) VALUES (${passwordHash})
    RETURNING id
  `;
  return String((rows[0] as { id: string }).id);
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<'ok' | 'wrong_password' | 'no_password'> {
  const hash = await getPasswordHashForUser(userId);
  if (!hash) return 'no_password';
  if (!verifyPassword(currentPassword, hash)) return 'wrong_password';

  const sql = requireDb();
  await sql`
    UPDATE users SET password_hash = ${hashPassword(newPassword)}
    WHERE id = ${userId}::uuid
  `;
  return 'ok';
}

export async function getPasswordHashForUser(userId: string): Promise<string | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT password_hash FROM users WHERE id = ${userId}::uuid LIMIT 1
  `;
  const hash = (rows[0] as { password_hash?: string | null } | undefined)?.password_hash;
  return hash ?? null;
}

/** Login by unique festie name (case-insensitive). */
export async function verifyFestieLogin(
  name: string,
  password: string,
): Promise<string | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT f.user_id, u.password_hash
    FROM festies f
    JOIN users u ON u.id = f.user_id
    WHERE lower(trim(f.name)) = lower(trim(${name}))
    LIMIT 1
  `;
  const row = rows[0] as { user_id: string; password_hash: string | null } | undefined;
  if (!row?.password_hash) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return String(row.user_id);
}

export async function isFestieNameTaken(name: string, exceptUserId?: string): Promise<boolean> {
  const sql = requireDb();
  const rows = exceptUserId
    ? await sql`
        SELECT 1 FROM festies
        WHERE lower(trim(name)) = lower(trim(${name}))
          AND user_id <> ${exceptUserId}::uuid
        LIMIT 1
      `
    : await sql`
        SELECT 1 FROM festies
        WHERE lower(trim(name)) = lower(trim(${name}))
        LIMIT 1
      `;
  return rows.length > 0;
}

export { hashPassword };
