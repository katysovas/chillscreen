/** Postgres undefined_column (42703) — column not migrated yet. */
export function isMissingColumnError(err: unknown, column: string): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes(column) && (msg.includes('does not exist') || msg.includes('42703'));
}
