import { getChatterCharacter } from '@/lib/chatterCast';
import { resolveDrawingModelId } from './drawingModel';
import type { GeneratedNpc } from '@/lib/npcGenerator';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { pickConversationSeed } from '@/lib/npcChatter/seeds';
import { getBundledSeedPools } from '@/lib/seeds/bundled';
import { getSkyPeriod, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { scheduleFor, STAGE_PLAYLISTS, type StageChannel } from '@/lib/stageVideos';
import { EMPTY_STAGE_SYNC } from '@/lib/stageSyncCore';
import { parseVenueSlug } from '@/lib/venueSlugs';
import rawStagePlaylists from '@/data/stage-playlists.json';
import { fetchEaselDrawingHistory } from './drawingHistory';
import { CHANNEL_NPC_POOL, vibeForChannelNpc } from './stageNpcPool';

export type EaselDrawingContext = {
  npcId: string;
  npcName: string;
  modelId: string;
  vibe: string | null;
  personalityNotes: string;
  skyPeriod: SkyPeriod;
  streamTitle: string | null;
  channelName: string;
  seedPrompt: string | null;
  seedKind: 'stream' | 'topic' | 'ambient' | 'demo';
  uniqueNonce: string;
  /** Topics this NPC already painted here — must not repeat. */
  priorTopics: string[];
  priorDrawingIds: string[];
};

function channelLabel(channel: StageChannel): string {
  const label = rawStagePlaylists.channels[channel]?.label?.trim();
  return label || channel;
}

function streamTitleForStage(stageSlug: string): string | null {
  const route = parseVenueSlug(stageSlug);
  if (!route) return null;
  const channel = stageChannelForRoute(route);
  const sync = {
    ...EMPTY_STAGE_SYNC,
    playlists: { ...STAGE_PLAYLISTS },
  };
  const sched = scheduleFor(channel, Date.now(), sync);
  return sched?.video.title?.trim() ?? null;
}

function vibeForNpc(npcId: string, channel: StageChannel): string | null {
  return vibeForChannelNpc(channel, npcId);
}

function personalityFallback(channel: StageChannel): string {
  const pool = CHANNEL_NPC_POOL[channel] ?? [];
  const sample = pool[0] as GeneratedNpc | undefined;
  return sample?.personalityNotes?.trim() || sample?.vibe?.trim() || 'festival crowd regular';
}

/** Gather moment context for an NPC easel drawing (server-side). */
export async function buildEaselDrawingContext(
  npcId: string,
  stageSlug: string,
): Promise<EaselDrawingContext> {
  const ch = getChatterCharacter(npcId);
  const npcName = ch?.name ?? npcId.split('-').pop() ?? npcId;
  const modelId = resolveDrawingModelId(npcId);

  const route = parseVenueSlug(stageSlug);
  const channel = route ? stageChannelForRoute(route) : 'cinema';
  const channelName = channelLabel(channel);
  const streamTitle = streamTitleForStage(stageSlug);
  const seedPick = pickConversationSeed(streamTitle, channelName, getBundledSeedPools(stageSlug));
  const history = await fetchEaselDrawingHistory(stageSlug, npcId);

  return {
    npcId,
    npcName,
    modelId,
    vibe: vibeForNpc(npcId, channel),
    personalityNotes: ch?.personalityNotes?.trim() || personalityFallback(channel),
    skyPeriod: getSkyPeriod(),
    streamTitle,
    channelName,
    seedPrompt: seedPick.seed,
    seedKind: seedPick.kind,
    uniqueNonce: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    priorTopics: history.topics,
    priorDrawingIds: history.drawingIds,
  };
}
