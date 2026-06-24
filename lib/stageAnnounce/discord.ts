import { SITE_URL } from '@/lib/site';
import { announceDescriptionForChannel } from '@/lib/stageAnnounce/config';
import type { StageChannel } from '@/lib/stageVideos';

export type DiscordAnnounceEmbed = {
  title: string;
  description: string;
  url: string;
};

export function buildDiscordAnnounceEmbed(
  venueSlug: string,
  channel: StageChannel,
  displayName: string,
): DiscordAnnounceEmbed {
  return {
    title: displayName,
    description: announceDescriptionForChannel(channel),
    url: `${SITE_URL}/${venueSlug}`,
  };
}

export function discordWebhookBody(embed: DiscordAnnounceEmbed): Record<string, unknown> {
  return {
    allowed_mentions: { parse: [] },
    embeds: [embed],
  };
}
