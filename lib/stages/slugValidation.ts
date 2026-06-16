import { checkBlocklist } from '@/lib/blocklist';
import { VENUE_SLUGS } from '@/lib/venueSlugs';
import { STAGE_CONFIG } from '@/lib/stages/config';

/** App routes and infrastructure slugs — never assignable to creators. */
export const RESERVED_STAGE_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'create',
  'watch',
  'privacy',
  'support',
  'stages',
  'vip',
  'www',
  'login',
  'signup',
  'signin',
  'auth',
  'help',
  'faq',
  'about',
  'terms',
  'robots',
  'sitemap',
  'opengraph-image',
  'favicon',
  ...VENUE_SLUGS,
]);

export type SlugRejectReason =
  | 'format'
  | 'length'
  | 'reserved'
  | 'profanity'
  | 'blocked_term'
  | 'taken';

export function normalizeStageSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/_/g, '-');
}

/** Derive a URL slug from a human-readable stage name. */
export function stageNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, STAGE_CONFIG.SLUG_MAX_LENGTH);
}

export function isValidStageSlugFormat(slug: string): boolean {
  if (slug.length < STAGE_CONFIG.SLUG_MIN_LENGTH || slug.length > STAGE_CONFIG.SLUG_MAX_LENGTH) {
    return false;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  return true;
}

export function validateStageSlugFormat(slug: string): SlugRejectReason | null {
  const norm = normalizeStageSlug(slug);
  if (
    norm.length < STAGE_CONFIG.SLUG_MIN_LENGTH
    || norm.length > STAGE_CONFIG.SLUG_MAX_LENGTH
  ) {
    return 'length';
  }
  if (!isValidStageSlugFormat(norm)) return 'format';
  if (RESERVED_STAGE_SLUGS.has(norm)) return 'reserved';
  const block = checkBlocklist(norm);
  if (!block.ok) {
    if (block.reason === 'profanity') return 'profanity';
    if (block.reason === 'blocked_term') return 'blocked_term';
  }
  return null;
}

export function slugRejectMessage(reason: SlugRejectReason): string {
  switch (reason) {
    case 'format':
      return 'Use lowercase letters, numbers, and hyphens (no leading/trailing hyphen).';
    case 'length':
      return `Slug must be ${STAGE_CONFIG.SLUG_MIN_LENGTH}–${STAGE_CONFIG.SLUG_MAX_LENGTH} characters.`;
    case 'reserved':
      return 'That slug is reserved.';
    case 'profanity':
      return 'Slug contains blocked language.';
    case 'blocked_term':
      return 'Slug contains a reserved word.';
    case 'taken':
      return 'That slug is already taken.';
  }
}
