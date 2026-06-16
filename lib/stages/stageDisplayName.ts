import type { UserStagePublic } from '@/lib/stages/types';

/** Truss label above creator stages — same casing as the farm "WHICH STAGE" sign. */
export function creatorStageTrussTitle(stage: UserStagePublic | null | undefined): string {
  const name = stage?.displayName?.trim();
  if (!name) return 'MY STAGE';
  return name.toUpperCase();
}
