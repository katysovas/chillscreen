import { venueSlugForRoute, type VenueRoute } from '@/lib/venueRoutes';
import { stagePathForSlug } from '@/lib/stages/runtime';
import type { FeaturedStageSummary } from '@/lib/stages/types';
import { stagePresetById } from '@/lib/stages/presets';
import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';

export type StagePickerTarget =
  | { kind: 'venue'; route: VenueRoute }
  | { kind: 'creator'; slug: string };

export type StagePickerOption = {
  id: string;
  title: string;
  tagline: string;
  target: StagePickerTarget;
};

export function stagePickerTargetId(target: StagePickerTarget): string {
  return target.kind === 'venue' ? `venue:${target.route}` : `creator:${target.slug}`;
}

export function stagePickerTargetFromId(id: string): StagePickerTarget | null {
  if (id.startsWith('creator:')) {
    const slug = id.slice('creator:'.length);
    return slug ? { kind: 'creator', slug } : null;
  }
  if (id.startsWith('venue:')) {
    const route = id.slice('venue:'.length) as VenueRoute;
    return route ? { kind: 'venue', route } : null;
  }
  return null;
}

export function buildStagePickerOptions(featured: FeaturedStageSummary[]): StagePickerOption[] {
  const venues: StagePickerOption[] = MOBILE_LOUNGE_STAGES.map(stage => ({
    id: `venue:${stage.route}`,
    title: stage.title,
    tagline: stage.tagline,
    target: { kind: 'venue', route: stage.route },
  }));

  const creators: StagePickerOption[] = featured.map(stage => ({
    id: `creator:${stage.slug}`,
    title: stage.displayName,
    tagline: stagePresetById(stage.preset)?.label ?? 'Creator stage',
    target: { kind: 'creator', slug: stage.slug },
  }));

  return [...venues, ...creators];
}

export function currentStagePickerTarget(
  venueRoute: VenueRoute | null | undefined,
  creatorSlug?: string | null,
): StagePickerTarget | null {
  if (creatorSlug?.trim()) {
    return { kind: 'creator', slug: creatorSlug.trim().toLowerCase() };
  }
  if (venueRoute) return { kind: 'venue', route: venueRoute };
  return null;
}

export function pathForStageTarget(target: StagePickerTarget): string {
  if (target.kind === 'creator') {
    return stagePathForSlug(target.slug);
  }
  return `/${venueSlugForRoute(target.route)}`;
}

export function stageTargetsEqual(a: StagePickerTarget, b: StagePickerTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'creator' && b.kind === 'creator') return a.slug === b.slug;
  if (a.kind === 'venue' && b.kind === 'venue') return a.route === b.route;
  return false;
}
