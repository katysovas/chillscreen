import type { StageStream } from '@/lib/stages/types';

/** YouTube channel name for on-stage marquee — never the video title. */
export function streamChannelName(stream: StageStream): string {
  return stream.channelTitle?.trim() ?? '';
}

/** Short uppercase strip for the on-stage marquee. */
export function streamChannelMarquee(stream: StageStream, maxLen = 34): string {
  const name = streamChannelName(stream);
  if (!name) return '';
  if (name.length <= maxLen) return name.toUpperCase();
  return `${name.slice(0, maxLen - 1).trimEnd()}…`.toUpperCase();
}

/** @deprecated Use streamChannelMarquee */
export const streamArtistMarquee = streamChannelMarquee;

/** @deprecated Use streamChannelName */
export const streamArtistName = streamChannelName;
