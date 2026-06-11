import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

/** Neon serverless SQL — returns null when DATABASE_URL is unset. */
export function getDb(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sql) sql = neon(url);
  return sql;
}

export function requireDb(): NeonQueryFunction<false, false> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}
