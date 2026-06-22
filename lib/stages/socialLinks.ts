import { STAGE_CONFIG } from '@/lib/stages/config';

export type StageSocialLinkKind =
  | 'youtube'
  | 'x'
  | 'instagram'
  | 'soundcloud'
  | 'tiktok'
  | 'patreon'
  | 'website';

export type StageSocialLinks = Partial<Record<StageSocialLinkKind, string>>;

export const STAGE_SOCIAL_LINK_KINDS: StageSocialLinkKind[] = [
  'youtube',
  'x',
  'instagram',
  'soundcloud',
  'tiktok',
  'patreon',
  'website',
];

export const STAGE_SOCIAL_LINK_FIELDS: ReadonlyArray<{
  kind: StageSocialLinkKind;
  label: string;
  placeholder: string;
}> = [
  { kind: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { kind: 'x', label: 'X', placeholder: 'https://x.com/handle' },
  { kind: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/handle' },
  { kind: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/artist' },
  { kind: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@handle' },
  { kind: 'patreon', label: 'Patreon', placeholder: 'https://patreon.com/creator' },
  { kind: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
];

const KIND_SET = new Set<string>(STAGE_SOCIAL_LINK_KINDS);

const HOST_CHECKS: Record<Exclude<StageSocialLinkKind, 'website'>, RegExp> = {
  youtube: /^(www\.)?(youtube\.com|youtu\.be)$/i,
  x: /^(www\.)?(x\.com|twitter\.com)$/i,
  instagram: /^(www\.)?instagram\.com$/i,
  soundcloud: /^(www\.)?soundcloud\.com$/i,
  tiktok: /^(www\.)?(tiktok\.com|vm\.tiktok\.com)$/i,
  patreon: /^(www\.)?patreon\.com$/i,
};

export const STAGE_SOCIAL_LINKS_HINT =
  'Optional. Paste full profile links — shown on your stage Info tab.';

export function emptyStageSocialLinks(): StageSocialLinks {
  return {};
}

export function normalizeSocialLinkUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function limitSocialLinkInput(raw: string): string {
  return raw.slice(0, STAGE_CONFIG.SOCIAL_LINK_MAX_LENGTH);
}

function isStageSocialLinkKind(value: string): value is StageSocialLinkKind {
  return KIND_SET.has(value);
}

export function parseSocialLinksJson(raw: unknown): StageSocialLinks {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: StageSocialLinks = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isStageSocialLinkKind(key)) continue;
    const url = typeof value === 'string' ? normalizeSocialLinkUrl(value) : '';
    if (url) out[key] = url;
  }
  return out;
}

export function normalizeStageSocialLinks(raw: StageSocialLinks): StageSocialLinks {
  const out: StageSocialLinks = {};
  for (const field of STAGE_SOCIAL_LINK_FIELDS) {
    const url = normalizeSocialLinkUrl(raw[field.kind] ?? '');
    if (url) out[field.kind] = url;
  }
  return out;
}

export function socialLinksEqual(a: StageSocialLinks, b: StageSocialLinks): boolean {
  for (const field of STAGE_SOCIAL_LINK_FIELDS) {
    const left = normalizeSocialLinkUrl(a[field.kind] ?? '');
    const right = normalizeSocialLinkUrl(b[field.kind] ?? '');
    if (left !== right) return false;
  }
  return true;
}

export function validateSocialLinkUrl(
  kind: StageSocialLinkKind,
  raw: string,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = normalizeSocialLinkUrl(trimmed);
  if (normalized.length > STAGE_CONFIG.SOCIAL_LINK_MAX_LENGTH) {
    return `Links must be ${STAGE_CONFIG.SOCIAL_LINK_MAX_LENGTH} characters or fewer.`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return 'Enter a valid URL.';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Enter a valid URL.';
  }

  if (kind === 'website') return null;

  const host = parsed.hostname.toLowerCase();
  if (!HOST_CHECKS[kind].test(host)) {
    const label = STAGE_SOCIAL_LINK_FIELDS.find(f => f.kind === kind)?.label ?? kind;
    return `Must be a ${label} link.`;
  }

  return null;
}

export function validateStageSocialLinks(links: StageSocialLinks): string | null {
  for (const field of STAGE_SOCIAL_LINK_FIELDS) {
    const err = validateSocialLinkUrl(field.kind, links[field.kind] ?? '');
    if (err) return `${field.label}: ${err}`;
  }
  return null;
}

export function stageSocialLinkDisplayLabel(
  kind: StageSocialLinkKind,
  href: string,
): string {
  if (kind === 'website') {
    try {
      return new URL(href).hostname.replace(/^www\./i, '');
    } catch {
      return 'Website';
    }
  }
  return STAGE_SOCIAL_LINK_FIELDS.find(f => f.kind === kind)?.label ?? kind;
}
