import {
  normalizeStageSlug,
  validateStageSlugFormat,
} from '@/lib/stages/slugValidation';

/** Slugs valid for festie home stages — built-in venues or active user-created stages. */
export async function resolveStageSlugForFestie(raw: string): Promise<string | null> {
  const slug = normalizeStageSlug(raw);
  if (!slug) return null;

  const { parseVenueSlug } = await import('@/lib/venueSlugs');
  if (parseVenueSlug(slug)) return slug;

  if (validateStageSlugFormat(slug)) return null;

  const { isValidActiveStageSlug } = await import('@/lib/stages/db');
  return (await isValidActiveStageSlug(slug)) ? slug : null;
}
