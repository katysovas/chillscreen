import type { UserStagePublic } from '@/lib/stages/types';
import type { VenueRoute } from '@/lib/venueSlugs';
import { venueSeoForRoute } from '@/lib/venueSeo';
import { STAGE_CONFIG, STAGE_NAME_FIELD_HINT } from '@/lib/stages/config';
import { stageNameToSlug, validateStageSlugFormat } from '@/lib/stages/slugValidation';

/** Curated venue pages that reuse the creator truss but aren't user-owned stages. */
const BUILTIN_TRUSS_VENUE_ROUTES = new Set<VenueRoute>(['hula', 'headliner']);

export function builtInVenueTrussTitle(route: VenueRoute | undefined): string | null {
  if (!route || !BUILTIN_TRUSS_VENUE_ROUTES.has(route)) return null;
  return venueSeoForRoute(route).title.toUpperCase();
}

/** Truss label above creator stages — same casing as the farm "WHICH STAGE" sign. */
export function creatorStageTrussTitle(
  stage: UserStagePublic | null | undefined,
  venueRoute?: VenueRoute,
): string {
  const name = stage?.displayName?.trim();
  if (name) return name.toUpperCase();
  return builtInVenueTrussTitle(venueRoute) ?? 'MY STAGE';
}

/** Clamp typed input to max length. */
export function limitStageDisplayNameInput(raw: string): string {
  return raw.slice(0, STAGE_CONFIG.DISPLAY_NAME_MAX_LENGTH);
}

export function validateStageDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Stage name is required.';
  if (
    trimmed.length < STAGE_CONFIG.SLUG_MIN_LENGTH
    || trimmed.length > STAGE_CONFIG.DISPLAY_NAME_MAX_LENGTH
  ) {
    return STAGE_NAME_FIELD_HINT;
  }
  const slugErr = validateStageSlugFormat(stageNameToSlug(name));
  if (slugErr) return STAGE_NAME_FIELD_HINT;
  return null;
}

export const stageDisplayNameHint = STAGE_NAME_FIELD_HINT;
