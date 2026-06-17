import { SITE_NAME } from '@/lib/site';
import { stagePresetById } from '@/lib/stages/presets';
import { nowPlayingStream, stagePathForSlug } from '@/lib/stages/runtime';
import type { UserStagePublic } from '@/lib/stages/types';

export type CreatorStageSeo = {
  /** Human stage name — breadcrumbs, headings. */
  name: string;
  /** Keyword-rich <title> (site name appended in metadata). */
  metaTitle: string;
  /** Meta description (~150–160 characters). */
  description: string;
  /** Longer copy for JSON-LD / structured data. */
  longDescription: string;
  keywords: string[];
  /** Canonical path, e.g. /watch/my-stage */
  path: string;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Scene label for a stage's visual template, e.g. "Nature", "City". */
export function creatorStageSceneLabel(stage: UserStagePublic): string {
  return stagePresetById(stage.preset)?.label ?? 'festival';
}

/** Now-playing label like "Lofi Beats by ChilledCow" when a lineup exists. */
function nowPlayingLabel(stage: UserStagePublic): string | null {
  const stream = nowPlayingStream(stage);
  const title = stream?.title?.trim();
  if (!title) return null;
  const channel = stream?.channelTitle?.trim();
  return channel ? `${title} by ${channel}` : title;
}

/**
 * Build SEO copy for a user-created stage from its display name, scene preset,
 * and current lineup. Falls back gracefully when fields are missing.
 */
export function creatorStageSeo(stage: UserStagePublic): CreatorStageSeo {
  const name = stage.displayName?.trim() || stage.slug;
  const scene = creatorStageSceneLabel(stage).toLowerCase();
  const nowPlaying = nowPlayingLabel(stage);
  const trackCount = stage.streams.length;

  const metaTitle = `${name} — Live ${creatorStageSceneLabel(stage)} Stage`;

  const descriptionBase = nowPlaying
    ? `Watch ${name} on ${SITE_NAME} — now playing ${nowPlaying}. Hang out in a live ${scene} festival world with friends, free in your browser.`
    : `Watch ${name}, a live ${scene} stage on ${SITE_NAME}. Hang out, stream synced video, and meet other festival-goers — free in your browser.`;

  const lineupNote = trackCount > 1 ? ` A ${trackCount}-track lineup plays in sync for everyone in the room.` : '';
  const longDescription =
    `${name} is a creator-made ${scene} stage on ${SITE_NAME}. ` +
    `Step into a live, multiplayer festival world, watch synchronized streams, chat with other ` +
    `visitors and NPCs, and bring an AI festie that keeps vibing at the stage after you leave.${lineupNote}` +
    (nowPlaying ? ` Now playing: ${nowPlaying}.` : '');

  const keywords = [
    name,
    `${name} stage`,
    'creator stage',
    'live stream watch party',
    `${scene} festival`,
    'watch together',
    SITE_NAME,
  ];
  const channel = nowPlayingStream(stage)?.channelTitle?.trim();
  if (channel) keywords.push(channel);

  return {
    name,
    metaTitle,
    description: truncate(descriptionBase, 160),
    longDescription,
    keywords,
    path: stagePathForSlug(stage.slug),
  };
}
