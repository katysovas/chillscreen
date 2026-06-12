import type { VenueSeo } from '@/lib/venueSeo';
import { SITE_NAME } from '@/lib/site';

/** Parse ?friend= from invite links — letters and spaces only, max 24 chars. */
export function parseFriendParam(friend: string | string[] | undefined): string | null {
  const raw = Array.isArray(friend) ? friend[0] : friend;
  if (!raw?.trim()) return null;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (decoded.length < 1 || decoded.length > 24) return null;
    if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Page title + description when a friend invite query param is present. */
export function invitePageCopy(seo: VenueSeo, friendName: string | null): {
  title: string;
  description: string;
} {
  if (!friendName) {
    return { title: seo.metaTitle, description: seo.description };
  }
  return {
    title: `${friendName} invited you to ${seo.title}`,
    description:
      `${friendName} invited you to ${seo.title} on ${SITE_NAME}. ` +
      seo.description,
  };
}
