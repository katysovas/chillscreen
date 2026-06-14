import { canonicalVenueSlug } from '@/lib/venueSlugs';

export function normalizeEaselStage(stage: string): string {
  return canonicalVenueSlug(stage);
}

/** DB may still have legacy slug rows (e.g. chill-cinema). */
export function easelStageLookupSlugs(stage: string): string[] {
  const canonical = normalizeEaselStage(stage);
  if (canonical === 'cinema') return ['cinema', 'chill-cinema'];
  return [canonical];
}
