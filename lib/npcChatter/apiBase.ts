/** Resolve Next.js API origin for PartyKit → Vercel calls (chatter, seeds, festies). */
export function chatterApiBase(env: Record<string, string | undefined>): string {
  if (env.CHATTER_API_URL?.trim()) {
    return env.CHATTER_API_URL.trim().replace(/\/api\/npc-chatter\/?$/, '');
  }
  if (env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '');
  }
  if (env.VERCEL_URL?.trim()) return `https://${env.VERCEL_URL.trim()}`;
  if (env.PARTYKIT_DEV === 'true') return 'http://127.0.0.1:3000';
  return 'https://whichstage.com';
}

export function npcChatterApiUrl(env: Record<string, string | undefined>): string {
  return `${chatterApiBase(env)}/api/npc-chatter`;
}
