import type { StagePickerTarget } from '@/lib/stagePickerOptions';
import { parseVenueSlug } from '@/lib/venueRoutes';

const STORAGE_KEY = 'whichstage-last-stage';

export type SignInFrom =
  | { source: 'home' }
  | { source: 'stage'; stage: StagePickerTarget };

export function getLastUsedStage(): StagePickerTarget | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StagePickerTarget;
    if (data.kind === 'venue' && data.route) return data;
    if (data.kind === 'creator' && data.slug?.trim()) {
      return { kind: 'creator', slug: data.slug.trim().toLowerCase() };
    }
    return null;
  } catch {
    return null;
  }
}

export function setLastUsedStage(target: StagePickerTarget): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
  } catch {
    /* private mode */
  }
}

export function festieStageSlugToTarget(slug: string): StagePickerTarget | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const route = parseVenueSlug(normalized);
  if (route) return { kind: 'venue', route };
  return { kind: 'creator', slug: normalized };
}

/** Where to go after sign-in — stay on current stage, else last visited, else festie home. */
export function resolveSignInDestination(
  from: SignInFrom,
  festieStageSlug: string,
): StagePickerTarget | null {
  if (from.source === 'stage') return from.stage;
  return getLastUsedStage() ?? festieStageSlugToTarget(festieStageSlug);
}
