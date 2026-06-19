import { chatterApiBase } from '../lib/npcChatter/apiBase';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { isBlockedByList, type BlockCheckInput } from '../lib/moderation/blocklistCheck';

type CachedBlock = {
  id: number;
  kind: 'user_id' | 'display_name' | 'ip';
  value: string;
};

let cache: { expiresAt: number; blocks: CachedBlock[] } | null = null;
const TTL_MS = 60_000;

export function clientIpFromRequest(request: {
  headers: { get(name: string): string | null };
}): string | null {
  const cf = request.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || null;
}

async function fetchBlocklist(env: Record<string, string | undefined>): Promise<CachedBlock[]> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) return cache.blocks;

  const secret = env.NPC_CHATTER_SECRET?.trim();
  if (!secret) {
    cache = { expiresAt: now + TTL_MS, blocks: [] };
    return cache.blocks;
  }

  try {
    const res = await fetch(`${chatterApiBase(env)}/api/moderation/blocklist`, {
      headers: chatterAuthHeader(secret),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      cache = { expiresAt: now + 10_000, blocks: cache?.blocks ?? [] };
      return cache.blocks;
    }
    const data = await res.json() as { blocks?: CachedBlock[] };
    cache = { expiresAt: now + TTL_MS, blocks: data.blocks ?? [] };
    return cache.blocks;
  } catch {
    cache = { expiresAt: now + 10_000, blocks: cache?.blocks ?? [] };
    return cache?.blocks ?? [];
  }
}

export function invalidateBlocklistCache(): void {
  cache = null;
}

export async function isConnectionBlocked(
  env: Record<string, string | undefined>,
  input: BlockCheckInput,
): Promise<boolean> {
  const blocks = await fetchBlocklist(env);
  return isBlockedByList(blocks, input);
}
