import { checkBlocklist } from '@/lib/blocklist';
import { FESTIE_PRESETS, FESTIE_TOPICS } from '@/lib/festie/presets';
import type { FestieAttributes, FestiePreset } from '@/lib/festie/types';
import { VENUE_SLUGS } from '@/lib/venueSlugs';

const PRESET_IDS = new Set(FESTIE_PRESETS.map(p => p.id));
const TOPIC_SET = new Set<string>(FESTIE_TOPICS);
const STAGE_SLUGS = new Set<string>(VENUE_SLUGS);

export function isValidFestieName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2
    && trimmed.length <= 20
    && /^[a-zA-Z0-9_]+$/.test(trimmed);
}

export function sanitizeFestieNameInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
}

export function isValidFestiePassword(password: string): boolean {
  return password.length >= 6 && password.length <= 64;
}

export function validateFestiePassword(password: string): string | null {
  if (!isValidFestiePassword(password)) {
    return 'Password must be 6–64 characters.';
  }
  return null;
}

export function validateFestieName(name: string): string | null {
  if (!isValidFestieName(name)) {
    return 'Name must be 2–20 characters: letters, numbers, or underscore (no spaces).';
  }
  const block = checkBlocklist(name);
  if (!block.ok) {
    if (block.reason === 'profanity') return 'Name contains blocked language.';
    if (block.reason === 'blocked_term') return 'Name contains a reserved word.';
  }
  return null;
}

export function validatePersonalityNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null;
  const trimmed = notes.trim();
  if (trimmed.length > 280) return 'Notes must be 280 characters or fewer.';
  const block = checkBlocklist(trimmed);
  if (!block.ok) {
    if (block.reason === 'profanity') return 'Notes contain blocked language.';
    if (block.reason === 'blocked_term') return 'Notes contain a reserved word.';
  }
  return null;
}

export function parseAttributes(raw: unknown): FestieAttributes {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const clamp = (n: unknown, fallback: number) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.min(10, Math.max(1, Math.round(v)));
  };
  return {
    energy: clamp(o.energy, 5),
    friendliness: clamp(o.friendliness, 5),
    chattiness: clamp(o.chattiness, 5),
  };
}

export function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t !== 'string') continue;
    const key = t.trim().toLowerCase();
    if (!TOPIC_SET.has(key) || out.includes(key)) continue;
    out.push(key);
    if (out.length >= 3) break;
  }
  return out;
}

export function parsePreset(raw: unknown): FestiePreset | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim().toLowerCase() as FestiePreset;
  return PRESET_IDS.has(id) ? id : null;
}

export function parseStageSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  return STAGE_SLUGS.has(slug) ? slug : null;
}

export function isValidNotifyEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function validateNotifyEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  if (!isValidNotifyEmail(email)) return 'Enter a valid email address.';
  return null;
}
