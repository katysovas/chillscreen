/** Postgres timestamptz — always ISO 8601 (Neon may return Date objects). */
export function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return trimmed;
  }
  if (value == null) return '';
  return String(value);
}
