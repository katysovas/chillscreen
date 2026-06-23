/** Max length for ambient / peer chat lines. */
export const CHAT_MESSAGE_MAX_LEN = 120;

/** Blocks domain-like patterns and spelled-out TLDs. */
const BLOCKED_TLD =
  /(?:^|[\s(/@])(?:[a-z0-9-]+\.)+(?:com|net|org|co|io|edu|gov|uk|de|fr|info|biz|xyz|me|tv|app|dev|ai|us|ca|gg|ly|to)(?:\b|\/|$)/i;

const SPELLED_TLD =
  /\b(?:dot|\.)?\s*(?:com|net|org|co|io)\b/i;

/** Compact profanity list — substring match on normalized text. */
const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn',
  'cunt', 'dick', 'pussy', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'retard', 'kike', 'spic', 'chink',
];

export type FilterRejectReason = 'empty' | 'url' | 'profanity' | 'length';

export type FilterResult =
  | { ok: true; text: string }
  | { ok: false; reason: FilterRejectReason };

function normalizeForProfanity(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasBlockedUrl(text: string): boolean {
  if (BLOCKED_TLD.test(text)) return true;
  if (SPELLED_TLD.test(text)) return true;
  if (/https?:\/\//i.test(text)) return true;
  if (/\bwww\./i.test(text)) return true;
  return false;
}

export function hasProfanity(text: string): boolean {
  const norm = normalizeForProfanity(text);
  if (!norm) return false;
  const padded = ` ${norm} `;
  return BAD_WORDS.some(w => padded.includes(` ${w} `) || norm === w);
}

/** Strip profanity tokens — used on NPC/LLM lines before broadcast. */
export function scrubProfanity(text: string): string {
  return text
    .split(/\b/)
    .filter(part => {
      const norm = part.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!norm) return true;
      return !BAD_WORDS.includes(norm);
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip HTML/XML-like tags LLMs sometimes leak into chat lines. */
export function stripNpcMarkupTags(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][a-z0-9:-]*(?:\s[^>]*)?\/?>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove sentence-ending periods — NPC chat voice never uses dots. Keeps ? ! and decimals (3.5). */
export function stripNpcChatterDots(text: string): string {
  return stripNpcMarkupTags(text)
    .replace(/(?<!\d)\.(?!\d)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Scrub profanity; return null if nothing usable remains. */
export function sanitizeNpcLine(text: string, minLen = 3): string | null {
  const scrubbed = stripNpcChatterDots(scrubProfanity(text.trim()));
  if (scrubbed.length < minLen || hasProfanity(scrubbed)) return null;
  return scrubbed;
}

/** Sanitize player chat before send or broadcast. */
export function filterChatMessage(raw: string): FilterResult {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > CHAT_MESSAGE_MAX_LEN) return { ok: false, reason: 'length' };
  if (hasBlockedUrl(text)) return { ok: false, reason: 'url' };
  if (hasProfanity(text)) return { ok: false, reason: 'profanity' };
  return { ok: true, text };
}
