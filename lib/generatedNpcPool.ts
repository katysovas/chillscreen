import type { GeneratedNpc } from '@/lib/npcGenerator';
import type { StageChannel } from '@/lib/stageVideos';

/** Channels that reuse another channel's generated NPC pool (IDs still use the live channel). */
export const GENERATED_NPC_POOL_SOURCE: Partial<Record<StageChannel, StageChannel>> = {
  hula: 'which-stage',
};

export function generatedNpcPoolSourceChannel(channel: StageChannel): StageChannel {
  return GENERATED_NPC_POOL_SOURCE[channel] ?? channel;
}

export function resolveGeneratedNpcPool(
  channels: Partial<Record<StageChannel, GeneratedNpc[]>>,
  channel: StageChannel,
): GeneratedNpc[] {
  const source = generatedNpcPoolSourceChannel(channel);
  return channels[source] ?? channels[channel] ?? [];
}
