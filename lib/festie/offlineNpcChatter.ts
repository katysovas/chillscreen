import { chatterNpcIds, chatterNpcIdsForRoute } from '@/lib/chatterCast';
import { FESTIE_CONFIG } from '@/lib/festie/config';
import { touchFestieLastChat } from '@/lib/festie/db';
import { countFestieNpcChatterSince } from '@/lib/festie/events';
import { lifeLogSeed, streamAtTime, venueLabelForSlug } from '@/lib/festie/lifeLogs';
import { logFestiePairChatter } from '@/lib/festie/logNpcChatter';
import type { FestieRow } from '@/lib/festie/types';
import { festieNpcId } from '@/lib/festie/toCharacterDef';
import { npcChatterLlmConfigured } from '@/lib/npcChatter/completeLine';
import { HOUSE_MODEL_DEFAULT, pickLineBudget } from '@/lib/npcChatter/constants';
import { generatePairConvo } from '@/lib/npcChatter/generate';
import { pickConversationSeed } from '@/lib/npcChatter/seeds';
import { parseVenueSlug } from '@/lib/venueSlugs';

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickPartnerNpcId(festie: FestieRow, slot: number): string | null {
  const route = parseVenueSlug(festie.stage_slug);
  const pool = route ? chatterNpcIdsForRoute(route) : chatterNpcIds();
  if (pool.length === 0) return null;

  const rng = mulberry32(lifeLogSeed(festie.id, festie.last_seen_at, slot + 2000));
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

/** Generate one LLM festie ↔ NPC chat (called by offline cron, not on sign-in). */
export async function generateOneOfflineFestieNpcChat(
  festie: FestieRow,
  at: Date = new Date(),
): Promise<boolean> {
  if (!npcChatterLlmConfigured()) return false;

  const npcCount = await countFestieNpcChatterSince(festie.id, festie.last_seen_at);
  if (npcCount >= FESTIE_CONFIG.MAX_CHATS_PER_OFFLINE_CYCLE) return false;

  const route = parseVenueSlug(festie.stage_slug);
  const channelName = venueLabelForSlug(festie.stage_slug);
  const houseModel = process.env.HOUSE_MODEL?.trim() || HOUSE_MODEL_DEFAULT;
  const festieNpc = festieNpcId(festie.id);
  const partnerId = pickPartnerNpcId(festie, npcCount);
  if (!partnerId) return false;

  const stream = streamAtTime(route, at.getTime());
  const seedPick = pickConversationSeed(stream?.title ?? null, channelName, festie.stage_slug);

  const lines = await generatePairConvo({
    stage: festie.stage_slug,
    npcA: festieNpc,
    npcB: partnerId,
    seed: seedPick.seed,
    lineBudget: pickLineBudget(),
    recentChat: [],
    streamTitle: stream?.title ?? null,
    channelName,
    houseModel,
  });

  if (lines.length < 2) return false;

  const createdAt = at.toISOString();
  await logFestiePairChatter(festieNpc, partnerId, lines, createdAt);
  await touchFestieLastChat(festie.id);
  return true;
}
