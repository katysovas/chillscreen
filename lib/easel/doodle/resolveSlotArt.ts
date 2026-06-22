import { easelChannelForStageSlugSync } from '@/lib/easel/stageChannel';
import { strokeProgramForSlot } from '@/lib/easel/resolveProgram';
import type { DoodleSpriteProgram, EaselArtProgram, EaselSlotSync } from '@/lib/easel/types';
import type { VenueRoute } from '@/lib/venueSlugs';
import { manifestEntryForNpc } from './manifest';
import {
  doodleTotalSegments,
  isDoodleSpriteProgram,
  manifestEntryToProgram,
} from './program';
import { paletteForStageChannel } from './palettes';

export type ResolvedSlotArt = {
  art: EaselArtProgram;
  totalSegments: number;
  segmentsDone: number;
  fromManifest: boolean;
};

/** Curated doodle for this slot — ignores DB stroke cache. */
export function doodleArtForSlot(
  stageSlug: string,
  slot: EaselSlotSync,
  layoutRoute?: VenueRoute | null,
): DoodleSpriteProgram | null {
  if (isDoodleSpriteProgram(slot.program)) return slot.program;
  const entry = manifestEntryForNpc(stageSlug, slot.npc, []);
  if (!entry) return null;
  const channel = easelChannelForStageSlugSync(stageSlug, layoutRoute);
  const { palette, bgHex } = paletteForStageChannel(channel);
  return manifestEntryToProgram(entry, palette, bgHex);
}

function scaleSegmentsDone(
  segmentsDone: number,
  fromTotal: number,
  toTotal: number,
  status: EaselSlotSync['status'],
): number {
  if (status === 'done') return toTotal;
  if (fromTotal <= 0 || fromTotal === toTotal) {
    return Math.min(segmentsDone, toTotal);
  }
  return Math.min(
    toTotal,
    Math.round((segmentsDone / fromTotal) * toTotal),
  );
}

/**
 * Pick doodle sprite (manifest) over cached stroke programs.
 * Client + server safe — works even when PartyKit still has old program_json.
 */
export function resolveSlotArt(
  stageSlug: string,
  slot: EaselSlotSync,
  layoutRoute?: VenueRoute | null,
): ResolvedSlotArt | null {
  const doodle = doodleArtForSlot(stageSlug, slot, layoutRoute);
  if (doodle) {
    const totalSegments = doodleTotalSegments(doodle);
    return {
      art: doodle,
      totalSegments,
      segmentsDone: scaleSegmentsDone(
        slot.segments_done,
        slot.total_segments,
        totalSegments,
        slot.status,
      ),
      fromManifest: !isDoodleSpriteProgram(slot.program),
    };
  }

  const stroke = strokeProgramForSlot(slot);
  if (!stroke) return null;
  return {
    art: stroke,
    totalSegments: slot.total_segments,
    segmentsDone: slot.segments_done,
    fromManifest: false,
  };
}
