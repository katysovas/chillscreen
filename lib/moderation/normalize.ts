import type { ModerationBlockKind } from './types';

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/^user:/i, '').toLowerCase();
}

export function normalizeBlockValue(kind: ModerationBlockKind, value: string): string {
  const trimmed = value.trim();
  if (kind === 'display_name') return normalizeDisplayName(trimmed);
  if (kind === 'user_id') return trimmed.toLowerCase();
  return trimmed;
}

export function stageSenderForDisplayName(name: string): string {
  return `user:${name.trim()}`;
}
