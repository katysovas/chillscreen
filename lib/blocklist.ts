/** Shared blocklist for festie names, notes, and chat — extends messageFilter profanity. */

import { hasProfanity } from '@/lib/messageFilter';

/** Impersonation + festival-mark terms (lowercase substring match). */
const BLOCKED_TERMS = [
  'admin',
  'moderator',
  'mod team',
  'whichstage',
  'official',
  'support',
  'bonnaroo',
  'coachella',
  'edc',
  'lollapalooza',
  'ultra',
  'tomorrowland',
];

export type BlocklistRejectReason = 'profanity' | 'blocked_term' | 'format';

export function normalizeBlocklistText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function hasBlockedTerm(text: string): boolean {
  const norm = normalizeBlocklistText(text);
  return BLOCKED_TERMS.some(term => norm.includes(term));
}

export function checkBlocklist(text: string): { ok: true } | { ok: false; reason: BlocklistRejectReason } {
  if (!text.trim()) return { ok: false, reason: 'format' };
  if (hasProfanity(text)) return { ok: false, reason: 'profanity' };
  if (hasBlockedTerm(text)) return { ok: false, reason: 'blocked_term' };
  return { ok: true };
}
