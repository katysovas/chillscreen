import type { UserStagePublic } from '@/lib/stages/types';
import { STAGE_CONFIG, STAGE_NAME_FIELD_HINT } from '@/lib/stages/config';
import { stageNameToSlug, validateStageSlugFormat } from '@/lib/stages/slugValidation';

/** Truss label above creator stages — same casing as the farm "WHICH STAGE" sign. */
export function creatorStageTrussTitle(stage: UserStagePublic | null | undefined): string {
  const name = stage?.displayName?.trim();
  if (!name) return 'MY STAGE';
  return name.toUpperCase();
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
