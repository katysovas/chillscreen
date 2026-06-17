import { STAGE_CONFIG } from '@/lib/stages/config';

export const STAGE_DESCRIPTION_FIELD_HINT =
  `Up to ${STAGE_CONFIG.DESCRIPTION_MAX_LENGTH} characters.`;

/** Clamp typed input to max length. */
export function limitStageDescriptionInput(raw: string): string {
  return raw.slice(0, STAGE_CONFIG.DESCRIPTION_MAX_LENGTH);
}

export function normalizeStageDescription(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

export function validateStageDescription(description: string): string | null {
  const trimmed = description.trim();
  if (!trimmed) return null;
  if (trimmed.length > STAGE_CONFIG.DESCRIPTION_MAX_LENGTH) {
    return STAGE_DESCRIPTION_FIELD_HINT;
  }
  return null;
}
