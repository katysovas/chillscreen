import type { UserStagePublic } from '@/lib/stages/types';
import { STAGE_CONFIG } from '@/lib/stages/config';

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
  if (trimmed.length > STAGE_CONFIG.DISPLAY_NAME_MAX_LENGTH) {
    return '20 characters max.';
  }
  return null;
}

export const stageDisplayNameHint =
  `20 characters max. Slug must be ${STAGE_CONFIG.SLUG_MIN_LENGTH}–${STAGE_CONFIG.SLUG_MAX_LENGTH} characters.`;
