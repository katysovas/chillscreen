import { parseVenueSlug } from '@/lib/venueSlugs';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import rawStagePlaylists from '@/data/stage-playlists.json';
import { scheduleFor, type StageChannel, type StageSync } from '@/lib/stageVideos';

/** Parse `whichstage-thefarm` → venue slug `thefarm`. */
export function venueSlugFromRoomId(roomId: string): string | null {
  const prefix = 'whichstage-';
  if (!roomId.startsWith(prefix)) return null;
  return roomId.slice(prefix.length) || null;
}

export function stageSlugForRoom(roomId: string): string {
  const slug = venueSlugFromRoomId(roomId);
  if (!slug) return 'thefarm';
  const route = parseVenueSlug(slug);
  if (!route) return slug;
  return slug;
}

export function streamContextForRoom(
  roomId: string,
  sync: StageSync,
  now = Date.now(),
): { streamTitle: string | null; channelName: string } {
  const slug = venueSlugFromRoomId(roomId);
  const route = slug ? parseVenueSlug(slug) : null;
  const channel: StageChannel = route ? stageChannelForRoute(route) : 'which-stage';
  const sched = scheduleFor(channel, now, sync);
  const label =
    rawStagePlaylists.channels[channel]?.label?.trim() || channel;
  return {
    streamTitle: sched?.video.title?.trim() || null,
    channelName: label,
  };
}
