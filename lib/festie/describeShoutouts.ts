import { stripNpcChatterDots } from '@/lib/messageFilter';
import type { FestiePublic } from '@/lib/festie/types';

/** First shout after joining — sooner so owners notice it working. */
export const FESTIE_DESCRIBE_SHOUTOUT_FIRST_MIN_MS = 40_000;
export const FESTIE_DESCRIBE_SHOUTOUT_FIRST_MAX_MS = 80_000;
/** Steady-state cadence after the first shout. */
export const FESTIE_DESCRIBE_SHOUTOUT_INTERVAL_MIN_MS = 90_000;
export const FESTIE_DESCRIBE_SHOUTOUT_INTERVAL_MAX_MS = 240_000;
export const FESTIE_SHOUTOUT_COOLDOWN_MS = 120_000;
export const FESTIE_SHOUTOUT_MAX_WORDS = 4;
export const FESTIE_SHOUTOUT_MAX_TOKENS = 16;

export function festieHasDescribeShoutoutNotes(festie: FestiePublic): boolean {
  if (!festie.personality_notes?.trim()) return false;
  return festie.control_mode === 'ai' || Boolean(festie.owner_on_stage);
}

/** Clamp model output to 1–4 words for ambient bubbles. */
export function clampFestieDescribeShoutout(text: string): string {
  const cleaned = stripNpcChatterDots(text)
    .replace(/["'`]/g, '')
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length === 0) return 'vibes';
  const count = Math.min(FESTIE_SHOUTOUT_MAX_WORDS, Math.max(1, words.length));
  return words.slice(0, count).join(' ');
}

/** Offline fallback when LLM is unavailable — still echoes describe notes. */
export function fallbackFestieDescribeShoutout(notes: string): string {
  const chunks = notes
    .split(/[,;.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const source = chunks.length > 0
    ? chunks[Math.floor(Math.random() * chunks.length)]!
    : notes.trim();
  const words = source
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  if (words.length === 0) return 'vibes';
  const len = 1 + Math.floor(Math.random() * Math.min(FESTIE_SHOUTOUT_MAX_WORDS, words.length));
  const start = Math.floor(Math.random() * Math.max(1, words.length - len + 1));
  return clampFestieDescribeShoutout(words.slice(start, start + len).join(' '));
}

export function buildFestieDescribeShoutoutPrompt(opts: {
  festieName: string;
  describeNotes: string;
  stage: string;
  autopilot?: boolean;
}): string {
  const { festieName, describeNotes, stage, autopilot = false } = opts;
  const role = autopilot
    ? `You are ${festieName} — a festie avatar wandering ${stage} on autopilot while your human watches.`
    : `You are ${festieName} — a festie avatar wandering ${stage} while your human is here on stage.`;
  return [
    role,
    `Owner description: ${describeNotes}`,
    'Shout ONE tiny festival aside to yourself — exactly 1 to 4 words only.',
    'It must feel inspired by the owner description (vibe, hobby, joke, mood).',
    'No quotes, no name prefix, no @mentions, no emoji, no period at the end.',
    'Examples of shape: "moon mode", "still vibing", "greg where", "taco brain"',
    'Output only the shout — nothing else.',
  ].join('\n');
}
