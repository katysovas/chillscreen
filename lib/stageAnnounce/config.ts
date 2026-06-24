import rawStagePlaylists from '@/data/stage-playlists.json';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { venueSlugFromRoomId } from '@/lib/npcChatter/roomContext';
import type { StageChannel } from '@/lib/stageVideos';
import { parseVenueSlug } from '@/lib/venueSlugs';

const stagePlaylistsFile = rawStagePlaylists as {
  channels: Record<StageChannel, { label?: string; announce?: boolean }>;
};

/** Client-visible flag from static stage JSON — webhook url stays server-side only. */
export function channelAnnounces(channel: StageChannel): boolean {
  return stagePlaylistsFile.channels[channel]?.announce === true;
}

export function stageLabelForChannel(channel: StageChannel): string {
  return stagePlaylistsFile.channels[channel]?.label?.trim() || channel;
}

export function stageChannelForRoom(roomId: string): StageChannel | null {
  const slug = venueSlugFromRoomId(roomId);
  if (!slug) return null;
  const route = parseVenueSlug(slug);
  if (!route) return null;
  return stageChannelForRoute(route);
}

export function venueSlugForRoom(roomId: string): string | null {
  return venueSlugFromRoomId(roomId);
}

/** `DISCORD_WEBHOOK_THEFARM` for slug `thefarm`. */
export function discordWebhookEnvKey(venueSlug: string): string {
  return `DISCORD_WEBHOOK_${venueSlug.replace(/-/g, '_').toUpperCase()}`;
}

export function announceDescriptionForChannel(channel: StageChannel): string {
  const label = stageLabelForChannel(channel).toLowerCase();
  return `now playing at ${label}`;
}
