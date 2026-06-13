import { getChatterCharacter, resolveNpcModelId } from '@/lib/chatterCast';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { pickConversationSeed } from '@/lib/npcChatter/seeds';
import { getBundledSeedPools } from '@/lib/seeds/bundled';
import { getSkyPeriod, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { scheduleFor, STAGE_PLAYLISTS, type StageChannel } from '@/lib/stageVideos';
import { STAGE_EPOCH, DEFAULT_DURATION_MS, EMPTY_STAGE_SYNC } from '@/lib/stageSyncCore';
import { parseVenueSlug } from '@/lib/venueSlugs';
import rawStagePlaylists from '@/data/stage-playlists.json';

export type EaselDrawingContext = {
  npcId: string;
  npcName: string;
  modelId: string;
  personalityNotes: string;
  skyPeriod: SkyPeriod;
  streamTitle: string | null;
  channelName: string;
  seedPrompt: string | null;
  seedKind: 'stream' | 'topic' | 'ambient';
  uniqueNonce: string;
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

/** Gather moment context for an NPC easel drawing (server-side). */
export function buildEaselDrawingContext(npcId: string, stageSlug: string): EaselDrawingContext {
  const ch = getChatterCharacter(npcId);
  const npcName = ch?.name ?? npcId.split('-').pop() ?? npcId;
  const modelId = ch ? resolveNpcModelId(ch) : 'openai/gpt-4.1-nano';
  const personalityNotes = ch?.personalityNotes?.trim() || 'outdoor cinema crowd watcher';

  const route = parseVenueSlug(stageSlug);
  const channel = route ? stageChannelForRoute(route) : 'cinema';
  const channelName = channelLabel(channel);
  const streamTitle = streamTitleForStage(stageSlug);
  const seedPick = pickConversationSeed(streamTitle, channelName, getBundledSeedPools(stageSlug));

  return {
    npcId,
    npcName,
    modelId,
    personalityNotes,
    skyPeriod: getSkyPeriod(),
    streamTitle,
    channelName,
    seedPrompt: seedPick.seed,
    seedKind: seedPick.kind,
    uniqueNonce: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
}
